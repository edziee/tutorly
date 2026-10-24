import { View, Text, Button, StyleSheet, Alert } from "react-native";
import React, { useState, useEffect, useRef } from 'react';

export const SessionStopwatch = ({ bookingId, studentName }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
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
        startTimeRef.current = Date.now() - elapsedTime;
    }

    const stop = () => {
        setIsRunning(false);
        setSessionEnded(true);
    }

    const stopPopup = () => {
        Alert.alert('Cancel session?', `Cancel your session with ${studentName}?`, [
            { text: 'Continue Session', style: 'cancel' },
            { text: 'Stop session', style: 'destructive', onPress: stop },
        ]);
    }

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
    }

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
            backgroundColor: 'hsl(115, 100%, 40%)',
        },

        stopButton: {
            backgroundColor: 'hsl(10, 90%, 50%)',
        },
    });

    return (
        <View style={styles.container}>
            <View style={styles.stopWatch}>
                <View><Text style={styles.display}>{formatTime()}</Text></View>
                <View style={styles.controls}>
                    {sessionEnded ?
                        <Text style={styles.sessionEnd}>Session has been ended successfully.</Text> :
                        isRunning ?
                            (<Button title="Stop Session" onPress={stopPopup} style={styles.stopButton} />) :
                            (<Button title="Start Session" onPress={start} style={styles.startButton} />)
                    }
                </View>
            </View>
        </View>
    );
}