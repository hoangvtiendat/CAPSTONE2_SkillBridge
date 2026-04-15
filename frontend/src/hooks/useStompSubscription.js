import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { WS_ENDPOINT } from '../config/appConfig';

const useStompSubscription = ({
    destination,
    onMessage,
    enabled = true,
    headers = {},
    reconnectDelay = 5000
}) => {
    const clientRef = useRef(null);
    const onMessageRef = useRef(onMessage);

    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    useEffect(() => {
        if (!enabled || !destination) return;

        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const client = new Client({
            webSocketFactory: () => new SockJS(WS_ENDPOINT),
            connectHeaders: {
                Authorization: `Bearer ${token}`,
                ...headers
            },
            reconnectDelay,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000
        });

        client.onConnect = () => {
            client.subscribe(destination, (message) => {
                onMessageRef.current?.(message);
            });
        };

        client.onStompError = (frame) => {
            console.error('STOMP error:', frame.headers?.message || 'unknown');
        };

        client.activate();
        clientRef.current = client;

        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
                clientRef.current = null;
            }
        };
    }, [destination, enabled, reconnectDelay, headers]);
};

export default useStompSubscription;
