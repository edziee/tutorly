import { View, Text, Button, StyleSheet, Alert } from "react-native";
import React, { useState, useEffect, useRef } from 'react';

export const SessionStopwatch = ({ session, bookingIdInSession, setBookingIdInSession, sessionTime, setSessionTime }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(sessionTime);
    const [sessionEnded, setSessionEnded] = useState(false);
    const intervalIdRef = useRef(null);
    const startTimeRef = useRef(0);

    useEffect(() => {
        if (isRunning) {
            intervalIdRef.current = setInterval(() => {
                setElapsedTime(Date.now() - startTimeRef.current);
            }, 10);
        }
        return () => {
            clearInterval(intervalIdRef.current);
        };
    }, [isRunning]);

    const start = () => {
        setIsRunning(true);
        setBookingIdInSession(session.id);
        startTimeRef.current = Date.now() - elapsedTime;
    };

    const stop = () => {
        setIsRunning(false);
        setElapsedTime(0);
        setSessionTime(0);
        setBookingIdInSession("");
        setSessionEnded(true);
    };

    const pause = () => {
        const pausedTime = Date.now() - startTimeRef.current;
        setElapsedTime(pausedTime);
        setSessionTime(pausedTime);
        setIsRunning(false);
    };

    const stopPopup = () => {
        Alert.alert('Cancel session?', `Cancel your session with ${session.studentName}?`, [
            { text: 'Continue Session', style: 'cancel' },
            { text: 'Stop session', style: 'destructive', onPress: stop },
        ]);
    };

    const formatTime = () => {
        let hours = Math.floor(elapsedTime / (1000 * 60 * 60));
        let minutes = Math.floor(elapsedTime / (1000 * 60) % 60);
        let seconds = Math.floor(elapsedTime / (1000) % 60);
        let milliseconds = Math.floor(elapsedTime % 1000 / 10);

        hours = String(hours).padStart(2, "0");
        minutes = String(minutes).padStart(2, "0");
        seconds = String(seconds).padStart(2, "0");
        milliseconds = String(milliseconds).padStart(2, "0");

        return `${hours}:${minutes}:${seconds}:${milliseconds}`;
    };

    const styles = StyleSheet.create({
        container: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        },

        stopWatch: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            border: 5,
            borderRadius: 50,
            backgroundColor: 'white',
            padding: 30,
        },

        display: {
            fontSize: 30,
            fontFamily: 'monospace',
            fontWeight: 'bold',
            marginBottom: 25,
        },

        controls: {
            fontSize: '1.5rem',
            fontWeight: 'bold',
            paddingVertical: 10,
            paddingHorizontal: 20,
            minWidth: 125,
            border: 'none',
            borderRadius: 10,
            color: 'white',
            transition: 'backgroundColor 0.5s ease',
            flexDirection: 'row',
            gap: 10,
        },

        startButton: {

        },

        stopButton: {

        },

        pauseButton: {

        },

        buttons: {
            flexDirection: 'row',
            gap: 10,
        },
    });

    return (
        <View style={styles.container}>
            <View style={styles.stopWatch}>
                <View><Text style={styles.display}>{session.id == bookingIdInSession ? formatTime() : '00:00:00'}</Text></View>
                <View style={styles.controls}>
                    {
                        sessionEnded ?
                            (<Text style={styles.sessionEnd}>Session has successfully ended.</Text>) :
                            session.status == 'completed' ?
                                (<Text style={styles.sessionEnd}>Session has ended.</Text>) :
                                (bookingIdInSession != "" && session.id != bookingIdInSession) ?
                                    (<Text style={styles.sessionEnd}>Another session is ongoing.</Text>) :
                                    isRunning ?
                                        (<View style={styles.buttons}>
                                            <Button title="Pause Session" onPress={pause} style={styles.pauseButton} />
                                            <Button title="Stop Session" onPress={stopPopup} style={styles.stopButton} />
                                        </View>) :

                                        (<Button title={elapsedTime == 0 ? "Start Session" : "Resume Session"} onPress={start} style={styles.startButton} />)
                    }
                </View>
            </View>
        </View>
    );
}