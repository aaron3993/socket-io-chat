import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import io from "socket.io-client";
import "./Chat.css";
import Controls from "./Controls";



const Page = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
  align-items: center;
  background-color: #46516e;
  flex-direction: column;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 500px;
  width: 30vw;
  max-height: 500px;
  overflow: auto;
  border: 1px solid lightgray;
  border-radius: 10px;
  padding-bottom: 10px;
  margin-top: 25px;
`;

const TextArea = styled.textarea`
  width: 98%;
  height: 100px;
  border-radius: 10px;
  margin-top: 10px;
  padding-left: 10px;
  padding-top: 10px;
  font-size: 17px;
  background-color: transparent;
  border: 1px solid lightgray;
  outline: none;
  color: lightgray;
  letter-spacing: 1px;
  line-height: 20px;
  ::placeholder {
    color: lightgray;
  }
`;

const Button = styled.button`
  background-color: pink;
  width: 100%;
  border: none;
  height: 50px;
  border-radius: 10px;
  color: #46516e;
  font-size: 17px;
`;

const Form = styled.form`
  width: 400px;
`;

const MyRow = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
`;

const MyMessage = styled.div`
  width: 45%;
  background-color: pink;
  color: #46516e;
  padding: 10px;
  margin-right: 5px;
  text-align: center;
  border-top-right-radius: 10%;
  border-bottom-right-radius: 10%;
`;

const PartnerRow = styled(MyRow)`
  justify-content: flex-start;
`;

const PartnerMessage = styled.div`
  width: 45%;
  background-color: transparent;
  color: lightgray;
  border: 1px solid lightgray;
  padding: 10px;
  margin-left: 5px;
  text-align: center;
  border-top-left-radius: 10%;
  border-bottom-left-radius: 10%;
`;
export default function Chat(props) {
  const [yourID, setYourID] = useState();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const youtubePlayer = useRef();


  const room = props.room;

  const socketRef = useRef();

  useEffect(() => {

    socketRef.current = io.connect('/');

    if (socketRef.current) {

      socketRef.current.emit('joinRoom', { username: props.username, room });
      socketRef.current.on("your id", id => {
        setYourID(id);
      })

      socketRef.current.on("message", (message) => {
        receivedMessage(message);
      })

      socketRef.current.on("videoAction", (action) => {
        if (action.type === "play") {
          youtubePlayer.current.playVideo();
        } else if (action.type === "pause") {
          console.log("pausing")
          youtubePlayer.current.pauseVideo();
        }
      })

      socketRef.current.on("provideVideoInfo", (videoInfo) => {
        const startTime = new Date().getTime();
        console.log(youtubePlayer.current.getPlayerState())
        // while(youtubePlayer.current.getPlayerState() === 5){
        //   console.log("hello from inside the while loop")
        // }
        const endTime = new Date().getTime();
        const bufferInterval = endTime - startTime;
       
        youtubePlayer.current.seekTo(videoInfo.time + bufferInterval/1000);
        youtubePlayer.current.playVideo();
      })

      socketRef.current.on("pingHostForInfo", info => {


        let videoInfo = {
          videoId: "Dm9Zf1WYQ_A",
          time: youtubePlayer.current.getCurrentTime(),
          play: true,
        }

        socketRef.current.emit("HostInfo", videoInfo)
      })
    }
  }, []);

  function handleAction(action) {
    if (socketRef.current) {
      socketRef.current.emit('videoAction', { type: action })
    }
  }


  function receivedMessage(message) {
    setMessages(oldMsgs => [...oldMsgs, message]);
  }

  function sendMessage(e) {
    e.preventDefault();
    const messageObject = {
      body: message,
      id: yourID,
    };
    setMessage("");
    socketRef.current.emit("send message", messageObject);
  }

  function handleChange(e) {
    setMessage(e.target.value);
  }

  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    window.onYouTubeIframeAPIReady = loadVideoPlayer;

  }, []);

  function loadVideoPlayer() {
    const player = new window.YT.Player('player', {
      height: 'auto',
      width: '100%',
      videoId: "Dm9Zf1WYQ_A",
      events: {
        onReady: onPlayerReady
      }

    });
    youtubePlayer.current = player;

  }
  function onPlayerReady(event) {
    socketRef.current.emit('requestVideoInfo', "");


  }


  return (
    <div className="chat-container">
      <div><div id="player" className="youtube-player" />
        <Controls handleAction={handleAction} /></div>

      <div className="text-chat">
        <Container socket={socketRef.current}>
          {messages.map((message, index) => {
            if (message.id === yourID) {
              return (
                <MyRow key={index}>
                  <MyMessage>
                    {`${message.username}: ${message.message}`}
                  </MyMessage>
                </MyRow>
              )
            }
            return (
              <PartnerRow key={index}>
                <PartnerMessage>
                  {`${message.username}: ${message.message}`}
                </PartnerMessage>
              </PartnerRow>
            )
          })}
        </Container>
        <Form onSubmit={sendMessage}>
          <TextArea value={message} onChange={handleChange} placeholder="Say something..." />
          <Button>Send</Button>
        </Form>
      </div>

    </div>
  )
}