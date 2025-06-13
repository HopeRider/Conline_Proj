

import React from "react";
import {
  EuiGlobalToastList,
  EuiProvider,
  EuiThemeProvider,
  EuiThemeColorMode
} from "@elastic/eui";
import { Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
//import "@elastic/eui/dist/eui_theme_light.css";
//import "@elastic/eui/dist/eui_theme_dark.css";
import { useAppSelector , useAppDispatch } from "./app/hooks";
import { useEffect, useState } from "react";
import ThemeSelector from "./app/components/ThemeSelector";
import CreateMeeting from "./pages/CreateMetting";
import OneOnOneMeeting from "./pages/OneOnOneMeeting";
import { setToasts } from "./app/slices/MeetingSlice";
import VideoConference from "./pages/VideoConference";
import MyMeetings from "./pages/MyMeetings";
import Meeting from "./pages/Meeting";
import JoinMeeting from "./pages/joinMeeting";

function App() {

  const dispatch = useAppDispatch ();
  const isDarkTheme = useAppSelector((zoomApp) => zoomApp.auth.isDarkTheme);
  const [isInitialTheme, setIsInitialTheme] = useState(true);
  const [theme, setTheme] = useState<EuiThemeColorMode>("light");
  const toasts = useAppSelector((zoom) => zoom.meetings.toasts);

  const removeToast = (removedToast: { id: string }) => {
    dispatch(
      setToasts(
        toasts.filter((toast: { id: string }) => toast.id !== removedToast.id)
      )
    );
  };
  
  useEffect(() => {
    const theme = localStorage.getItem("zoom-theme");
    if (theme) {
      setTheme(theme as EuiThemeColorMode);
    } else {
      localStorage.setItem("zoom-theme", "light");
    }
  }, []);

  useEffect(() => {
    if (isInitialTheme) setIsInitialTheme(false);
    else {
      window.location.reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDarkTheme]);



  const overrides = {
    colors: {
      LIGHT: { primary: "#0b5cff" },
      DARK: { primary: "#0b5cff" },
    },
  };

  return ( 
    <ThemeSelector>
    <EuiProvider>
      <EuiThemeProvider modify={overrides}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/create" element={<CreateMeeting />} />
        <Route path="/create1on1" element={<OneOnOneMeeting />} />
        <Route path="/videoconference" element={<VideoConference />} />
        <Route path="/mymeetings" element={<MyMeetings />} />
        <Route path="/meetings" element={<Meeting />} />
        <Route path="/join/:id" element={<JoinMeeting />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="*" element={<Dashboard />} />
      </Routes> 
      <EuiGlobalToastList
            toasts={toasts}
            dismissToast={removeToast}
            toastLifeTimeMs={4000}
          />
      </EuiThemeProvider>
    </EuiProvider>
    </ThemeSelector>
  ); 
}
export default App;
