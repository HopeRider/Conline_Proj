import React from 'react';
import {
    EuiButton,
    EuiFlexGroup,
    EuiFlexItem,
    EuiImage,
    EuiPanel,
    EuiProvider,
    EuiSpacer,
    EuiText,
    EuiTextColor,
  } from "@elastic/eui";
import animation from "../assets/animation.gif";
import logo from "../assets/logo.png";
import { GoogleAuthProvider,signInWithPopup,onAuthStateChanged } from 'firebase/auth';
import { firebaseAuth, firebaseDB, usersRef } from "../utils/FirebaseConfig";
import { collection, query, where, addDoc, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../app/hooks";
import { setUser } from "../app/slices/AuthSlice";


function Login(){

    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    onAuthStateChanged(firebaseAuth, (currentUser) => {
        if (currentUser) navigate("/");
    });

    const login = async () => {
        const provider = new GoogleAuthProvider()
        const {
            user: { displayName, email, uid },
          } = await signInWithPopup(firebaseAuth, provider);

          if (email) {
            const firestoreQuery = query(usersRef, where("uid", "==", uid));
            const fetchedUser = await getDocs(firestoreQuery);
            if (fetchedUser.docs.length === 0) {
               await addDoc(usersRef, {
                uid,
                name: displayName,
                email,  
              });
               /* 
              await addDoc(collection(firebaseDB, "users"), {
                uid,
                name: displayName,
                email,
              });*/
            }
            dispatch(setUser({ uid, name: displayName , email }));
            //dispatch(setUser({ uid, email: email!, name: displayName! }));
            navigate("/");
          }
    };
    

    return (
        <EuiProvider colorMode="dark">
        <EuiFlexGroup
        justifyContent="center"
        alignItems="center"
        style={{ width: "100vw", height: "100vh" }}>
        <EuiFlexItem grow={false}>
          <EuiPanel paddingSize="xl">
            <EuiFlexGroup justifyContent="center" alignItems="center">
              <EuiFlexItem>
                <EuiImage src={animation} alt="logo" />
              </EuiFlexItem>
              <EuiFlexItem>
                  <EuiText>
                    <h1 style={{ fontSize: "60px" , textAlign:"center"}}>
                   <EuiTextColor color="#00000">Conline</EuiTextColor>
                    </h1>
                  </EuiText>
                
                <EuiSpacer size="xl" />
                <EuiText textAlign="center" grow={false}>
                  <h3 >
                    <EuiTextColor>One Platform to</EuiTextColor>
                    <EuiTextColor color="#0b5cff"> connect</EuiTextColor>
                  </h3>
                </EuiText>
                <EuiSpacer size="l" />
                <EuiButton fill onClick={login}>
                  Login with Google
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiProvider>
    )
}

export default Login

// <EuiImage src={logo} alt="logo" size="230px" />