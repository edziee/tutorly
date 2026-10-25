import { View, Text, Platform, StyleSheet, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';

import AppButton from './AppButton';
import { BOOKING_STATUS, TOKEN_BOOKING_STATUS } from '../constants/statuses';
import { updateBookingStatus, updateBookingTimer } from '../services/bookingService';
import { colors } from '../theme/colors';
import {
    formatRecordedDuration,
    getCompletionTimerError,
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
        const message = `Record the teaching time for ${session.studentName}? Stopping does not complete the booking or transfer payment.`;
        if (Platform.OS === 'web') {
            if (globalThis.confirm(`Stop session timer?\n\n${message}`)) {
                applyAction(SESSION_TIMER_ACTIONS.STOP);
            }
            return;
        }
        Alert.alert('Stop session timer?', message, [
            { text: 'Continue Session', style: 'cancel' },
            { text: 'Stop Timer', style: 'destructive', onPress: () => applyAction(SESSION_TIMER_ACTIONS.STOP) },
        ]);
    };

    const confirmCompletion = () => {
        const timerError = getCompletionTimerError(session);
        if (timerError) {
            setError(timerError);
            return;
        }
        const paymentMessage = session.tokenStatus === TOKEN_BOOKING_STATUS.RESERVED
            ? 'This transfers the held tokens to your wallet.'
            : 'This older manual-payment booking will not transfer tokens. Resolve any payment separately.';
        Alert.alert('Confirm session completed?', `Recorded teaching time: ${formatRecordedDuration(elapsedSeconds)}. ${paymentMessage}`, [
            { text: 'Review again', style: 'cancel' },
            {
                text: 'Confirm completion',
                onPress: async () => {
                    try {
                        await updateBookingStatus(session.id, BOOKING_STATUS.COMPLETED);
                    } catch (completionError) {
                        setError(completionError.message || 'Could not confirm this session.');
                    }
                },
            },
        ]);
    };

    const styles = StyleSheet.create({
        container: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        },

        stopWatch: {
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: 18,
            borderWidth: 1,
            padding: 20,
            width: '100%',
        },

        display: {
            fontSize: 30,
            fontFamily: 'monospace',
            fontWeight: 'bold',
            marginBottom: 10,
            textAlign: 'center',
        },

        controls: {
            alignSelf: 'stretch',
            flexDirection: 'column',
            gap: 10,
            marginTop: 18,
        },

        buttonRow: {
            alignSelf: 'stretch',
            flexDirection: 'row',
            gap: 10,
        },

        buttonCell: {
            flex: 1,
        },

        fullButton: {
            alignSelf: 'stretch',
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
                        <>
                            <Text>{session.status === 'completed' ? 'Session completed.' : 'Timer stopped. Review the recorded time before confirming completion.'}</Text>
                        </>
                    ) : timerStatus === SESSION_TIMER_STATUS.RUNNING ? (
                        <View style={styles.buttonRow}>
                            <View style={styles.buttonCell}>
                                <AppButton title="Pause timer" variant="secondary" onPress={() => applyAction(SESSION_TIMER_ACTIONS.PAUSE)} />
                            </View>
                            <View style={styles.buttonCell}>
                                <AppButton title="Stop timer" variant="danger" onPress={stopPopup} />
                            </View>
                        </View>
                    ) : (
                        <View style={styles.fullButton}>
                            <AppButton title={timerStatus === SESSION_TIMER_STATUS.PAUSED ? 'Resume timer' : 'Start timer'} onPress={() => applyAction(timerStatus === SESSION_TIMER_STATUS.PAUSED ? SESSION_TIMER_ACTIONS.RESUME : SESSION_TIMER_ACTIONS.START)} />
                        </View>
                    )}
                    {session.status !== 'completed' ? (
                        <View style={styles.fullButton}>
                            <AppButton title="Confirm session completed" variant="primary" onPress={confirmCompletion} />
                        </View>
                    ) : null}
                </View>
            </View>
        </View>
    );
}