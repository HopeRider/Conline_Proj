import {
  EuiBasicTable,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
} from "@elastic/eui";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
  increment,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useToast from "../hooks/useToast";
import { firebaseAuth, meetingsRef, firebaseDB } from "../utils/FirebaseConfig";
import { generateMeetingID } from "../utils/generateMeetingId";

interface ParticipantStats {
  uid: string;
  name: string;
  angry: number;
  disgust: number;
  fear: number;
  happy: number;
  neutral: number;
  sad: number;
  surprise: number;
  totalFrames: number;
  lastEmotion: string;
}

interface LatestEmotionRow {
  uid: string;
  name: string;
  emotion: string;
}

export default function JoinMeeting() {
  const params = useParams();
  const navigate = useNavigate();
  const [createToast] = useToast();
  const [isAllowed, setIsAllowed] = useState(false);
  const [user, setUser] = useState<any>(undefined);
  const [userLoaded, setUserLoaded] = useState(false);
  const [emotion, setEmotion] = useState("Neutral");
  const [participants, setParticipants] = useState<ParticipantStats[]>([]);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const appId = 146573608;
  const serverSecret = "a693665bcb1a3e9ffdf2497fb0831479";

  // Calculate percentage for current frame summary (Overall row)
  const calculateCurrentFramePercentage = (emotionCount: number) => {
    const totalParticipants = Math.max(participants.length, 1);
    return `${Math.round((emotionCount / totalParticipants) * 100)}%`;
  };

  // Calculate percentage for accumulated frames
  const calculatePercentage = (count: number, total: number) => {
    return total > 0 ? `${Math.round((count / total) * 100)}%` : "0%";
  };

  // Calculate percentage of total frames for all participants
  const calculateTotalPercentage = (userFrames: number, allFrames: number) => {
    return allFrames > 0 ? `${Math.round((userFrames / allFrames) * 100)}%` : "0%";
  };

  // For Emotion Summary (current frame emotions)
  const participantsWithCurrentEmotion = [
    ...participants.map((p) => ({
      uid: p.uid,
      name: p.name,
      angry: p.lastEmotion === "Angry" ? 1 : 0,
      disgust: p.lastEmotion === "Disgust" ? 1 : 0,
      fear: p.lastEmotion === "Fear" ? 1 : 0,
      happy: p.lastEmotion === "Happy" ? 1 : 0,
      neutral: p.lastEmotion === "Neutral" ? 1 : 0,
      sad: p.lastEmotion === "Sad" ? 1 : 0,
      surprise: p.lastEmotion === "Surprise" ? 1 : 0,
      totalFrames: p.totalFrames,
      lastEmotion: p.lastEmotion,
    })),
    {
      uid: "overall",
      name: "Overall",
      angry: participants.filter((p) => p.lastEmotion === "Angry").length,
      disgust: participants.filter((p) => p.lastEmotion === "Disgust").length,
      fear: participants.filter((p) => p.lastEmotion === "Fear").length,
      happy: participants.filter((p) => p.lastEmotion === "Happy").length,
      neutral: participants.filter((p) => p.lastEmotion === "Neutral").length,
      sad: participants.filter((p) => p.lastEmotion === "Sad").length,
      surprise: participants.filter((p) => p.lastEmotion === "Surprise").length,
      totalFrames: participants.length,
      lastEmotion: "",
    },
  ];

  // For Emotion Statistics (accumulated frames)
  const participantsWithStats = [
    ...participants.map((p) => ({
      uid: p.uid,
      name: p.name,
      angry: p.angry,
      disgust: p.disgust,
      fear: p.fear,
      happy: p.happy,
      neutral: p.neutral,
      sad: p.sad,
      surprise: p.surprise,
      totalFrames: p.totalFrames,
      lastEmotion: p.lastEmotion,
    })),
    {
      uid: "overall",
      name: "Overall",
      angry: participants.reduce((sum, p) => sum + p.angry, 0),
      disgust: participants.reduce((sum, p) => sum + p.disgust, 0),
      fear: participants.reduce((sum, p) => sum + p.fear, 0),
      happy: participants.reduce((sum, p) => sum + p.happy, 0),
      neutral: participants.reduce((sum, p) => sum + p.neutral, 0),
      sad: participants.reduce((sum, p) => sum + p.sad, 0),
      surprise: participants.reduce((sum, p) => sum + p.surprise, 0),
      totalFrames: participants.reduce((sum, p) => sum + p.totalFrames, 0),
      lastEmotion: "",
    },
  ];

  const latestEmotions: LatestEmotionRow[] = participants.map((p) => ({
    uid: p.uid,
    name: p.name,
    emotion: p.lastEmotion,
  }));

  const latestColumns = [
    {
      field: "name",
      name: "Name",
    },
    {
      field: "emotion",
      name: "Emotion",
    },
  ];

  // Get total frames across all participants for percentage calculation
  const totalAllFrames = participants.reduce((sum, p) => sum + p.totalFrames, 0);

  useEffect(() => {
    onAuthStateChanged(firebaseAuth, (currentUser) => {
      if (currentUser) setUser(currentUser);
      setUserLoaded(true);
    });
  }, []);

  // Initialize camera when meeting is allowed
  useEffect(() => {
    if (!isAllowed) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          },
          audio: false // We only need video for emotion analysis
        });
        setCameraStream(stream);
        setCameraError(null);
      } catch (err) {
        console.error("Camera access error:", err);
        setCameraError("Could not access camera. Using video stream instead.");
      }
    };

    startCamera();

    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isAllowed]);

  useEffect(() => {
    const getMeetingData = async () => {
      if (params.id && userLoaded) {
        const firestoreQuery = query(
          meetingsRef,
          where("meetingId", "==", params.id)
        );
        const fetchedMeetings = await getDocs(firestoreQuery);

        if (fetchedMeetings.docs.length) {
          const meeting = fetchedMeetings.docs[0].data();
          const isCreator = meeting.createdBy === user?.uid;
          const meetingDate = moment(meeting.meetingDate);
          const today = moment();

          if (meeting.meetingType === "1-on-1") {
            if (meeting.invitedUsers[0] === user?.uid || isCreator) {
              if (meetingDate.isSame(today, "day")) {
                setIsAllowed(true);
              } else if (meetingDate.isBefore(today, "day")) {
                createToast({ title: "Meeting has ended.", type: "danger" });
                navigate(user ? "/" : "/login");
              } else {
                createToast({
                  title: `Meeting is on ${meeting.meetingDate}`,
                  type: "warning",
                });
                navigate(user ? "/" : "/login");
              }
            } else navigate(user ? "/" : "/login");
          } else if (meeting.meetingType === "video-conference") {
            const index = meeting.invitedUsers.findIndex(
              (invitedUser: string) => invitedUser === user?.uid
            );
            if (index !== -1 || isCreator) {
              if (meetingDate.isSame(today, "day")) {
                setIsAllowed(true);
              } else if (meetingDate.isBefore(today, "day")) {
                createToast({ title: "Meeting has ended.", type: "danger" });
                navigate(user ? "/" : "/login");
              } else {
                createToast({
                  title: `Meeting is on ${meeting.meetingDate}`,
                  type: "warning",
                });
              }
            } else {
              createToast({
                title: `You are not invited to the meeting.`,
                type: "danger",
              });
              navigate(user ? "/" : "/login");
            }
          } else {
            setIsAllowed(true);
          }
        }
      }
    };
    getMeetingData();
  }, [params.id, user, userLoaded, createToast, navigate]);

  const myMeeting = async (element: HTMLDivElement) => {
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appId,
      serverSecret,
      params.id as string,
      user?.uid || generateMeetingID(),
      user?.displayName || generateMeetingID()
    );
    const zp = ZegoUIKitPrebuilt.create(kitToken);
    zp.joinRoom({
      container: element,
      maxUsers: 50,
      sharedLinks: [
        {
          name: "Personal link",
          url: window.location.origin,
        },
      ],
      scenario: {
        mode: ZegoUIKitPrebuilt.VideoConference,
      },
    });
  };

  const updateEmotionStats = async (emotion: string) => {
    if (!user || !params.id) return;

    const emotionDocRef = doc(
      firebaseDB,
      "meeting-emotions",
      `${params.id}_${user.uid}`
    );

    try {
      const emotionDoc = await getDoc(emotionDocRef);
      
      const emotionUpdate = {
        [emotion.toLowerCase()]: increment(1),
        totalFrames: increment(1),
        lastEmotion: emotion,
        updatedAt: Date.now(),
        meetingId: params.id,
        uid: user.uid,
        name: user.displayName || "Unknown",
      };

      if (emotionDoc.exists()) {
        await updateDoc(emotionDocRef, emotionUpdate);
      } else {
        await setDoc(emotionDocRef, {
          angry: emotion === "Angry" ? 1 : 0,
          disgust: emotion === "Disgust" ? 1 : 0,
          fear: emotion === "Fear" ? 1 : 0,
          happy: emotion === "Happy" ? 1 : 0,
          neutral: emotion === "Neutral" ? 1 : 0,
          sad: emotion === "Sad" ? 1 : 0,
          surprise: emotion === "Surprise" ? 1 : 0,
          totalFrames: 1,
          lastEmotion: emotion,
          updatedAt: Date.now(),
          meetingId: params.id,
          uid: user.uid,
          name: user.displayName || "Unknown",
        });
      }
    } catch (error) {
      console.error("Error updating emotion stats:", error);
    }
  };

  const sendFrameToModel = async (imageData: string) => {
    try {
      const res = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });
      const data = await res.json();
      if (data.emotion) {
        console.log("Predicted Emotion:", data.emotion);
        setEmotion(data.emotion);
        await updateEmotionStats(data.emotion);
      } else if (data.error) {
        console.error("Error from server:", data.error);
      }
    } catch (err) {
      console.error("Error sending frame:", err);
    }
  };

  // Frame capture from camera
  useEffect(() => {
    if (!cameraStream) return;

    const captureFrame = async () => {
      try {
        const videoTrack = cameraStream.getVideoTracks()[0];
        
        // Method 1: Using ImageCapture API if available
        if ('ImageCapture' in window) {
          const imageCapture = new (window as any).ImageCapture(videoTrack);
          const bitmap = await imageCapture.grabFrame();
          
          const canvas = document.createElement('canvas');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(bitmap, 0, 0);
            const imageData = canvas.toDataURL('image/jpeg', 0.9);
            sendFrameToModel(imageData);
            return;
          }
        }

        // Method 2: Fallback using video element
        const videoElement = document.createElement('video');
        videoElement.srcObject = new MediaStream([videoTrack]);
        await new Promise((resolve) => {
          videoElement.onloadedmetadata = resolve;
          videoElement.play().catch(console.error);
        });

        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoElement, 0, 0);
          const imageData = canvas.toDataURL('image/jpeg', 0.9);
          sendFrameToModel(imageData);
        }
      } catch (err) {
        console.error("Frame capture error:", err);
        // Final fallback to ZegoCloud video element if direct capture fails
        const videoElement = document.querySelector("video");
        if (videoElement) {
          const canvas = document.createElement("canvas");
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            const fallbackImageData = canvas.toDataURL("image/jpeg");
            sendFrameToModel(fallbackImageData);
          }
        }
      }
    };

    const interval = setInterval(captureFrame, 3000);
    return () => clearInterval(interval);
  }, [cameraStream, user]);

  useEffect(() => {
    if (!params.id) return;
    const q = query(
      collection(firebaseDB, "meeting-emotions"),
      where("meetingId", "==", params.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          uid: data.uid,
          name: data.name,
          angry: data.angry || 0,
          disgust: data.disgust || 0,
          fear: data.fear || 0,
          happy: data.happy || 0,
          neutral: data.neutral || 0,
          sad: data.sad || 0,
          surprise: data.surprise || 0,
          totalFrames: data.totalFrames || 0,
          lastEmotion: data.lastEmotion || "Unknown",
        };
      });
      setParticipants(users);
    });

    return () => unsubscribe();
  }, [params.id]);

  return isAllowed ? (
    <div>
      

      {cameraError && (
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 10,
            padding: "8px 12px",
            backgroundColor: "#fff3cd",
            borderRadius: "10px",
            boxShadow: "0 0 10px rgba(0,0,0,0.2)",
            zIndex: 9999,
            color: "#856404",
          }}
        >
          {cameraError}
        </div>
      )}

      
      <div
        className="myCallContainer"
        ref={(el) => {
          if (el) myMeeting(el);
        }}
        style={{ width: "100%", height: "100vh" }}
      ></div>

      <div style={{ display: "flex", marginTop: "20px" }}>
        <div style={{ flex: 1, marginRight: "10px" }}>
          <EuiPanel>
            <h3>Emotion Summary (Current Frame)</h3>
            <EuiBasicTable
              items={participantsWithCurrentEmotion}
              columns={[
                {
                  field: "name",
                  name: "Participant",
                },
                {
                  name: "😊 Happy",
                  render: (p: any) => 
                    p.uid === "overall" 
                      ? calculateCurrentFramePercentage(p.happy)
                      : p.happy ? "Yes" : "No",
                },
                {
                  name: "😐 Neutral",
                  render: (p: any) =>
                    p.uid === "overall"
                      ? calculateCurrentFramePercentage(p.neutral)
                      : p.neutral ? "Yes" : "No",
                },
                {
                  name: "😢 Sad",
                  render: (p: any) =>
                    p.uid === "overall"
                      ? calculateCurrentFramePercentage(p.sad)
                      : p.sad ? "Yes" : "No",
                },
                {
                  name: "😮 Surprise",
                  render: (p: any) =>
                    p.uid === "overall"
                      ? calculateCurrentFramePercentage(p.surprise)
                      : p.surprise ? "Yes" : "No",
                },
                {
                  name: "😠 Angry",
                  render: (p: any) =>
                    p.uid === "overall"
                      ? calculateCurrentFramePercentage(p.angry)
                      : p.angry ? "Yes" : "No",
                },
                {
                  name: "😒 Disgust",
                  render: (p: any) =>
                    p.uid === "overall"
                      ? calculateCurrentFramePercentage(p.disgust)
                      : p.disgust ? "Yes" : "No",
                },
                {
                  name: "😨 Fear",
                  render: (p: any) =>
                    p.uid === "overall"
                      ? calculateCurrentFramePercentage(p.fear)
                      : p.fear ? "Yes" : "No",
                },
              ]}
            />
          </EuiPanel>
        </div>

        <div style={{ flex: 1, marginLeft: "10px" }}>
          <EuiPanel>
            <h3>Latest Emotion Per Participant</h3>
            <EuiBasicTable items={latestEmotions} columns={latestColumns} />
          </EuiPanel>
        </div>
      </div>

      <div style={{ marginTop: "20px" }}>
        <EuiPanel>
          <h3>Emotion Statistics (Accumulated Frames)</h3>
          <EuiBasicTable
            items={participantsWithStats}
            columns={[
              {
                field: "name",
                name: "Participant",
              },
              {
                name: "😊 Happy Frames",
                render: (p: any) => 
                  `${p.happy} (${calculatePercentage(p.happy, p.totalFrames)})`,
              },
              {
                name: "😐 Neutral Frames",
                render: (p: any) =>
                  `${p.neutral} (${calculatePercentage(p.neutral, p.totalFrames)})`,
              },
              {
                name: "😢 Sad Frames",
                render: (p: any) =>
                  `${p.sad} (${calculatePercentage(p.sad, p.totalFrames)})`,
              },
              {
                name: "😮 Surprise Frames",
                render: (p: any) =>
                  `${p.surprise} (${calculatePercentage(p.surprise, p.totalFrames)})`,
              },
              {
                name: "😠 Angry Frames",
                render: (p: any) =>
                  `${p.angry} (${calculatePercentage(p.angry, p.totalFrames)})`,
              },
              {
                name: "😒 Disgust Frames",
                render: (p: any) =>
                  `${p.disgust} (${calculatePercentage(p.disgust, p.totalFrames)})`,
              },
              {
                name: "😨 Fear Frames",
                render: (p: any) =>
                  `${p.fear} (${calculatePercentage(p.fear, p.totalFrames)})`,
              },
              {
                name: "Total Frames",
                render: (p: any) => 
                  p.uid === "overall" 
                    ? `${p.totalFrames} (100%)`
                    : `${p.totalFrames} (${calculateTotalPercentage(p.totalFrames, totalAllFrames)})`,
              },
            ]}
          />
        </EuiPanel>
      </div>
    </div>
  ) : (
    <></>
  );
}


/*
<div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          padding: "8px 12px",
          backgroundColor: "white",
          borderRadius: "10px",
          boxShadow: "0 0 10px rgba(0,0,0,0.2)",
          zIndex: 9999,
        }}
      >
        <strong>Emotion:</strong> {emotion}
      </div>
*/

/*
<div
        style={{
          position: "absolute",
          top: cameraError ? 120 : 60,
          left: 10,
          padding: "8px 12px",
          backgroundColor: "white",
          borderRadius: "10px",
          boxShadow: "0 0 10px rgba(0,0,0,0.2)",
          zIndex: 9999,
          maxHeight: "300px",
          overflowY: "auto",
        }}
      >
        <strong>Participants:</strong>
        <table style={{ marginTop: "8px", width: "100%" }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Emotion</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p) => (
              <tr key={p.uid}>
                <td>{p.name}</td>
                <td>{p.lastEmotion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
 */

