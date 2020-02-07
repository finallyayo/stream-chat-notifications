import React, { useState, useEffect } from 'react';
import './App.css';
import {
  Chat,
  Channel,
  ChannelHeader,
  Thread,
  Window,
  ChannelList,
  ChannelListTeam,
  MessageList,
  MessageTeam,
  MessageInput,
} from 'stream-chat-react';
import { StreamChat } from 'stream-chat';
import rug from 'random-username-generator';
import axios from 'axios';

import 'stream-chat-react/dist/css/index.css';

let chatClient;

function App() {
  const [channel, setChannel] = useState(null);
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);

  useEffect(() => {
    const username = rug.generate();
    async function getToken() {
      try {
        const response = await axios.post('http://localhost:7000/join', {
          username,
        });
        const { token } = response.data;
        const apiKey = response.data.api_key;

        chatClient = new StreamChat(apiKey);

        chatClient.setUser(
          {
            id: username,
            name: username,
          },
          token
        );

        const channel = chatClient.channel('team', 'group-chat');
        await channel.watch();
        setChannel(channel);

        channel.on(event => {
          if (event.type === 'message.new' && event.unread_count > 0) {
            new Notification(event.user.name, {
              body: event.message.text,
            });

            document.getElementById('favicon').href =
              'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/google/223/bell_1f514.png';
          }

          if (event.type === 'message.read' && !event.total_unread_count) {
            document.getElementById('favicon').href = '/favicon.ico';
          }
        });
      } catch (err) {
        console.log(err);
        return;
      }
    }

    getToken();

    if (
      window.Notification &&
      (Notification.permission === 'granted' ||
        Notification.permission === 'denied')
    )
      return;

    setShowNotificationBanner(true);
  }, []);

  function grantPermission() {
    if (Notification.permission === 'granted') {
      new Notification('You are already subscribed to web notifications');
      return;
    }

    if (
      Notification.permission !== 'denied' ||
      Notification.permission === 'default'
    ) {
      Notification.requestPermission().then(result => {
        if (result === 'granted') {
          new Notification('New message from Stream', {
            body: 'Nice, notifications are now enabled!',
          });
        }
      });
    }

    setShowNotificationBanner(false);
  }

  if (channel) {
    return (
      <Chat client={chatClient} theme="team dark">
        {showNotificationBanner && (
          <div class="alert">
            <p>
              Stream needs your permission to{' '}
              <button onClick={grantPermission}>
                enable desktop notifications
              </button>
            </p>
          </div>
        )}
        <ChannelList
          options={{
            subscribe: true,
            state: true,
          }}
          List={ChannelListTeam}
        />
        <Channel channel={channel}>
          <Window>
            <ChannelHeader />
            <MessageList Message={MessageTeam} />
            <MessageInput focus />
          </Window>
          <Thread Message={MessageTeam} />
        </Channel>
      </Chat>
    );
  }

  return <div></div>;
}

export default App;
