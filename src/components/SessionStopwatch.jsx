import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';

import { updateBookingTimer } from '../services/bookingService';
import {
    formatRecordedDuration,
    getRecordedSeconds,
    SESSION_TIMER_ACTIONS,
    SESSION_TIMER_STATUS,
} from '../utils/sessionTimer';

export const SessionStopwatch = ({ session }) => {
    const [now, setNow] = useState(Date.now());
    const [error, setError] = useState('');
    const timerStatus = session.timerStatus ?? SESSION_TIMER_STATUS.IDLE;
    const elapsedSeconds = getRecordedSeconds(session, now);

    useEffect(() => {
        if (timerStatus !== SESSION_TIMER_STATUS.RUNNING) return undefined;
        const intervalId = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(intervalId);
    }, [timerStatus, session.id]);

    useEffect(() => {
        setNow(Date.now());
        setError('');
    }, [session.id, session.timerStatus, session.accumulatedDurationSeconds, session.timerLastActionAt]);

    const applyAction = async (action) => {
        setError('');
        try {
            await updateBookingTimer(session.id, action);
        } catch (actionError) {
            setError(actionError.message || 'Could not update the session timer.');
        }
    };

    const stopPopup = () => {
        Alert.alert('Stop session timer?', `Record the teaching time for ${session.studentName}? Stopping does not complete the booking or transfer payment.`, [
            { text: 'Continue Session', style: 'cancel' },
            { text: 'Stop Timer', style: 'destructive', onPress: () => applyAction(SESSION_TIMER_ACTIONS.STOP) },
        ]);
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
                <View>
                    <Text style={styles.display}>{formatRecordedDuration(elapsedSeconds)}</Text>
                    <Text>Scheduled: {session.durationHours}h ({session.startTime} - {session.endTime})</Text>
                    <Text>Recorded teaching time</Text>
                </View>
                <View style={styles.controls}>
                    {error ? <Text accessibilityRole="alert">{error}</Text> : null}
                    {session.status === 'completed' || timerStatus === SESSION_TIMER_STATUS.STOPPED ? (
                        <Text>{session.status === 'completed' ? 'Session completed.' : 'Timer stopped. Review the recorded time before confirming completion.'}</Text>
                    ) : timerStatus === SESSION_TIMER_STATUS.RUNNING ? (
                        <View style={styles.buttons}>
                            <Button title="Pause Timer" onPress={() => applyAction(SESSION_TIMER_ACTIONS.PAUSE)} />
                            <Button title="Stop Timer" onPress={stopPopup} />
                        </View>
                    ) : (
                        <Button title={timerStatus === SESSION_TIMER_STATUS.PAUSED ? 'Resume Timer' : 'Start Timer'} onPress={() => applyAction(timerStatus === SESSION_TIMER_STATUS.PAUSED ? SESSION_TIMER_ACTIONS.RESUME : SESSION_TIMER_ACTIONS.START)} />
                    )}
                </View>
            </View>
        </View>
    );
}