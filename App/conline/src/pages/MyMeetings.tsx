import {
  EuiBadge,
  EuiBasicTable,
  EuiButtonIcon,
  EuiCopy,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiTitle,
  EuiFlyoutBody,
} from "@elastic/eui";
import { getDocs, query, where, collection, onSnapshot } from "firebase/firestore";
import moment from "moment";
import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import EditFlyout from "../app/components/EditFlyout";
import Header from "../app/components/Header";
import useAuth from "../hooks/useAuth";
import { meetingsRef, firebaseDB } from "../utils/FirebaseConfig";
import { MeetingType } from "../utils/Types";

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

export default function MyMeetings() {
  useAuth();
  const userInfo = useAppSelector((zoom) => zoom.auth.userInfo);
  const [meetings, setMeetings] = useState<Array<MeetingType>>([]);
  const [showEditFlyout, setShowEditFlyout] = useState(false);
  const [editMeeting, setEditMeeting] = useState<MeetingType>();
  const [showStatsFlyout, setShowStatsFlyout] = useState(false);
  const [statsMeeting, setStatsMeeting] = useState<MeetingType>();
  const [participants, setParticipants] = useState<ParticipantStats[]>([]);


  const calculateCurrentFramePercentage = (emotionCount: number) => {
    const totalParticipants = Math.max(participants.length, 1);
    return `${Math.round((emotionCount / totalParticipants) * 100)}%`;
  };


  const getMyMeetings = useCallback(async () => {
    const firestoreQuery = query(
      meetingsRef,
      where("createdBy", "==", userInfo?.uid)
    );
    const fetchedMeetings = await getDocs(firestoreQuery);
    if (fetchedMeetings.docs.length) {
      const myMeetings: Array<MeetingType> = [];
      fetchedMeetings.forEach((meeting) => {
        myMeetings.push({
          docId: meeting.id,
          ...(meeting.data() as MeetingType),
        });
      });
      setMeetings(myMeetings);
    }
  }, [userInfo?.uid]);

  useEffect(() => {
    if (userInfo) getMyMeetings();
  }, [userInfo, getMyMeetings]);

  const openEditFlyout = (meeting: MeetingType) => {
    setShowEditFlyout(true);
    setEditMeeting(meeting);
  };

  const closeEditFlyout = (dataChanged = false) => {
    setShowEditFlyout(false);
    setEditMeeting(undefined);
    if (dataChanged) getMyMeetings();
  };

  const openStatsFlyout = async (meeting: MeetingType) => {
    setStatsMeeting(meeting);
    setShowStatsFlyout(true);
    
    // Load participant stats for this meeting
    const q = query(
      collection(firebaseDB, "meeting-emotions"),
      where("meetingId", "==", meeting.meetingId)
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
  };

  const closeStatsFlyout = () => {
    setShowStatsFlyout(false);
    setStatsMeeting(undefined);
    setParticipants([]);
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

  const latestEmotions = participants.map((p) => ({
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

  const meetingColumns = [
    {
      field: "meetingName",
      name: "Meeting Name",
    },
    {
      field: "meetingType",
      name: "Meeting Type",
    },
    {
      field: "meetingDate",
      name: "Meeting Date",
    },
    {
      field: "",
      name: "Status",
      render: (meeting: MeetingType) => {
        if (meeting.status) {
          if (meeting.meetingDate === moment().format("L")) {
            return (
              <EuiBadge color="success">
                <Link
                  to={`/join/${meeting.meetingId}`}
                  style={{ color: "black" }}
                >
                  Join Now
                </Link>
              </EuiBadge>
            );
          } else if (
            moment(meeting.meetingDate).isBefore(moment().format("L"))
          ) {
            return <EuiBadge color="default">Ended</EuiBadge>;
          } else if (moment(meeting.meetingDate).isAfter()) {
            return <EuiBadge color="primary">Upcoming</EuiBadge>;
          }
        } else return <EuiBadge color="danger">Cancelled</EuiBadge>;
      },
    },
    {
      field: "",
      name: "Edit",
      width: "5%",
      render: (meeting: MeetingType) => {
        return (
          <EuiButtonIcon
            aria-label="meeting-edit"
            iconType="indexEdit"
            color="danger"
            display="base"
            isDisabled={
              moment(meeting.meetingDate).isBefore(moment().format("L")) ||
              !meeting.status
            }
            onClick={() => openEditFlyout(meeting)}
          />
        );
      },
    },
    {
      field: "",
      name: "Statistics",
      width: "5%",
      render: (meeting: MeetingType) => {
        return (
          <EuiButtonIcon
            aria-label="meeting-stats"
            iconType="stats"
            color="primary"
            display="base"
            isDisabled={moment(meeting.meetingDate).isAfter()}
            onClick={() => openStatsFlyout(meeting)}
          />
        );
      },
    },
    {
      field: "meetingId",
      name: "Copy Link",
      width: "5%",
      render: (meetingId: string) => {
        return (
          <EuiCopy
            textToCopy={`localhost:3000/join/${meetingId}`}
          >
            {(copy: any) => (
              <EuiButtonIcon
                iconType="copy"
                onClick={copy}
                display="base"
                aria-label="meeting-copy"
              />
            )}
          </EuiCopy>
        );
      },
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        flexDirection: "column",
      }}
    >
      <Header />
      <EuiFlexGroup justifyContent="center" style={{ margin: "1rem" }}>
        <EuiFlexItem>
          <EuiPanel>
            <EuiBasicTable items={meetings} columns={meetingColumns} />
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>
      {showEditFlyout && (
        <EditFlyout closeFlyout={closeEditFlyout} meeting={editMeeting!} />
      )}
      {showStatsFlyout && statsMeeting && (
  <EuiFlyout 
    ownFocus 
    onClose={closeStatsFlyout} 
    aria-labelledby="flyoutTitle"
    size="l" // Large size flyout
    style={{ width: '90%', maxWidth: '1250px' }} // Wider flyout
  >
    <EuiFlyoutHeader hasBorder>
      <EuiTitle size="m">
        <h2 id="flyoutTitle">Meeting Statistics: {statsMeeting.meetingName}</h2>
      </EuiTitle>
    </EuiFlyoutHeader>
    <EuiFlyoutBody>
      <EuiFlexGroup>
        {/* Current Frame Summary - Wider Panel */}
        <EuiFlexItem>
          <EuiPanel style={{ width: '900px' }}>
            <h3>Emotion Summary (Latest Frame)</h3>
            <div style={{ overflowX: 'auto' }}>
              <EuiBasicTable
                items={participantsWithCurrentEmotion}
                columns={[
                  {
                    field: "name",
                    name: "Participant",
                    width: '15%'
                  },
                  {
                    name: "😊 Happy",
                    width: '10%',
                    render: (p: any) => 
                      p.uid === "overall" 
                        ? calculateCurrentFramePercentage(p.happy)
                        : p.happy ? "Yes" : "No",
                  },
                  {
                    name: "😐 Neutral",
                    width: '10%',
                    render: (p: any) =>
                      p.uid === "overall"
                        ? calculateCurrentFramePercentage(p.neutral)
                        : p.neutral ? "Yes" : "No",
                  },
                  {
                    name: "😢 Sad",
                    width: '10%',
                    render: (p: any) =>
                      p.uid === "overall"
                        ? calculateCurrentFramePercentage(p.sad)
                        : p.sad ? "Yes" : "No",
                  },
                  {
                    name: "😮 Surprise",
                    width: '10%',
                    render: (p: any) =>
                      p.uid === "overall"
                        ? calculateCurrentFramePercentage(p.surprise)
                        : p.surprise ? "Yes" : "No",
                  },
                  {
                    name: "😠 Angry",
                    width: '10%',
                    render: (p: any) =>
                      p.uid === "overall"
                        ? calculateCurrentFramePercentage(p.angry)
                        : p.angry ? "Yes" : "No",
                  },
                  {
                    name: "😒 Disgust",
                    width: '10%',
                    render: (p: any) =>
                      p.uid === "overall"
                        ? calculateCurrentFramePercentage(p.disgust)
                        : p.disgust ? "Yes" : "No",
                  },
                  {
                    name: "😨 Fear",
                    width: '10%',
                    render: (p: any) =>
                      p.uid === "overall"
                        ? calculateCurrentFramePercentage(p.fear)
                        : p.fear ? "Yes" : "No",
                  },
                ]}
              />
            </div>
          </EuiPanel>
        </EuiFlexItem>

        {/* Latest Emotions - Wider Panel */}
        <EuiFlexItem>
          <EuiPanel style={{ width: '275px' }}>
            <h3>Latest Emotion Per Participant</h3>
            <div style={{ overflowX: 'auto' }}>
              <EuiBasicTable 
                items={latestEmotions} 
                columns={latestColumns}
                style={{ width: '100%' }}
              />
            </div>
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>
      
      {/* Accumulated Statistics - Full Width Panel */}
      <EuiPanel style={{ marginTop: "20px", width: '100%' }}>
        <h3>Emotion Statistics (Accumulated Frames)</h3>
        <div style={{ overflowX: 'auto' }}>
          <EuiBasicTable
            items={participantsWithStats}
            columns={[
              {
                field: "name",
                name: "Participant",
                width: '13%'
              },
              {
                name: "😊 Happy Frames",
                width: '10%',
                render: (p: any) => 
                  `${p.happy} (${calculatePercentage(p.happy, p.totalFrames)})`,
              },
              {
                name: "😐 Neutral Frames",
                width: '10%',
                render: (p: any) =>
                  `${p.neutral} (${calculatePercentage(p.neutral, p.totalFrames)})`,
              },
              {
                name: "😢 Sad Frames",
                width: '10%',
                render: (p: any) =>
                  `${p.sad} (${calculatePercentage(p.sad, p.totalFrames)})`,
              },
              {
                name: "😮 Surprise Frames",
                width: '10%',
                render: (p: any) =>
                  `${p.surprise} (${calculatePercentage(p.surprise, p.totalFrames)})`,
              },
              {
                name: "😠 Angry Frames",
                width: '10%',
                render: (p: any) =>
                  `${p.angry} (${calculatePercentage(p.angry, p.totalFrames)})`,
              },
              {
                name: "😒 Disgust Frames",
                width: '10%',
                render: (p: any) =>
                  `${p.disgust} (${calculatePercentage(p.disgust, p.totalFrames)})`,
              },
              {
                name: "😨 Fear Frames",
                width: '10%',
                render: (p: any) =>
                  `${p.fear} (${calculatePercentage(p.fear, p.totalFrames)})`,
              },
              {
                name: "Total Frames",
                width: '10%',
                render: (p: any) => 
                  p.uid === "overall" 
                    ? `${p.totalFrames} (100%)`
                    : `${p.totalFrames} (${calculateTotalPercentage(p.totalFrames, totalAllFrames)})`,
              },
            ]}
            style={{ width: '100%' }}
          />
        </div>
      </EuiPanel>
    </EuiFlyoutBody>
  </EuiFlyout>
)}
    </div>
  );
}


