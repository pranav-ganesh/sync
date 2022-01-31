const videoElem = document.getElementById("video");
const startElem = document.getElementById("start");
const stopElem = document.getElementById("stop");
const socket = io('/');  
const videoGrid = document.getElementById('video-grid') 
const myVideo = document.createElement('video'); 
const caption = document.createElement('H2'); 
const unique = document.getElementById('unique')
const btn = document.getElementById("myBtn");
const span = document.getElementsByClassName("close")[0];
myVideo.muted = true; 
let peers = {}; 
let sharePeers = {}
let isStreamRecording = false; 
var username = "Anonymous";
myVideoStream = 0;
let count = 0;
let foo = 0;
let arrOfParticipants = []
let numOfParticipants = 0
let status = "join"
let num = 0
let inter = 0
let inter_count = 0
let inter2 = 0


var peer = new Peer(undefined, {
    path: '/peerjs', // The path where your self-hosted PeerServer is running 
    host: '/', // server host 
    port: '443' // server port
}) // The Peer object is where we create and receive connections.

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    chatEnable()
    myVideo.style.borderStyle = "solid"
    myVideo.style.borderWidth = "1px"
    myVideo.style.borderColor = "#808080"
    myVideoStream = stream;
    addVideo(myVideo, stream); 
   
    peer.on('call', call => {
        // console.log(status)
        const answerCall = true; 
        if (status === "share") {
          $('video').hide()
        }
        const video = document.createElement('video'); 
        if (status === 'share') {
          video.setAttribute("id", "share_screen");
          video.style.width = "365%"
          video.style.height = "200%"
          video.style.marginLeft = "0px"
        } else {
          video.style.borderStyle = "solid"
          video.style.borderWidth = "1px"
          video.style.borderColor = "#808080"
        }

        if (answerCall) {
          call.answer(stream) 
          if (status === 'join') {
            peers[call.peer] = call;
          } else if (status === 'share') {
            sharePeers[call.peer] = call
          }
          call.on('stream', userVideoStream => {
            addVideo(video, userVideoStream); 
          })
        } else {
          console.log("Call Denied"); 
        }
        call.on('close', () => {
          video.remove() 
        })
    }) 

    peer.on('connection', (conn) => {
      conn.on('open', () => {
        conn.on('data', (data) => {
            for (let i = 0; i < data.length; i++) {
              if (!arrOfParticipants.includes(data[i])) {
                $("#participantsId").append(`<h1 style="color:black; text-indent:20px">${data[i]}</h1>`)
                arrOfParticipants.push(data[i])
              }
            }
        })
      })
    })
    
    socket.on('new-connection', (userId) => {  
        userConnection(userId, stream);
    })

    let chat_msg = $("#chat_message"); 
    $('html').keydown((enter) => {
        if (enter.which == 13 && chat_msg.val().length !== 0) {
            // console.log(username)
            socket.emit('message', chat_msg.val(), username);
            chat_msg.val('');
        }
    });
    
    socket.on("createMessage", (message, username) => {
        if (count == 1) {
          count = 0;
        } else {
          // var img = document.createElement('img'); 
          $("#chatbox").append(`<li class="message"><b>${username}</b><br/>${message}</li>`);
          count +=1;
        }
        scrollingEnabler();
    }) 

    let notes_message = $("#notes_message");
    $('html').keydown(function (enter) {
      if (enter.which == 13 && notes_message.val().length !== 0) {
        let notes_msg_value = notes_message.val()
        $("#notes").append(`<li class="message"><br/>${notes_msg_value}</li>`);
        notes_message.val('');
      }
      scrollNotesToBottom();
    });
}) // end of navigators.mediaDevices....

const rem_from_participants = (nou) => {
  var els = document.querySelectorAll('h1')
  for (let i = 0; i < els.length; i++) {
    el = els[i];    
    if (el.innerText == nou) {
        el.parentNode.removeChild(el)
    } 
  }
}

socket.on('user-disconnected', (userId, nameOfUser) => {
  if (userId == null) {
    console.log("NULL");
  } else {
    // console.log(nameOfUser)
    rem_from_participants(nameOfUser)

    for (let i = 0; i < arrOfParticipants.length; i++) {
      if (nameOfUser === arrOfParticipants[i]) {
        arrOfParticipants.splice(i, 1)
      }
    }
    
    if (nameOfUser != null) {
      let d = nameOfUser + " has left the meeting!"
      $("#chatbox").append(`<li class="message"><i><b style="color:red">${d}</b><i></li>`);
    }
    
    if (status == 'share') {
      // console.log(userId)
      // console.log(sharePeers)
      if (userId in sharePeers) {
        sharePeers[userId].close()
        $('video').show()
      }
      status = "join"
    } 

    if (userId == null) {
      console.log("NULL");
    } else {
      peers[userId].close(); 
    }
  }
}) 

socket.on('join', data => {
  if (inter != data || inter_count >= 1) {
    $("#chatbox").append(`<li class="message"><i><b style="color:yellow">${data}</b><i></li>`);
    inter = data
    inter_count = 0
    inter_count+=1
  } else {
    inter_count+=1
  }
})

peer.on('open', id => { 
  let urlafterslash = window.location.pathname.split('/')[1]
  new Swal({ 
    title: 'Enter your name',
    input: 'text',
    inputAttributes: {
      autocapitalize: 'off'
    },
    showCancelButton: true,
    confirmButtonText: 'Ok',
    width: '50%',
    showLoaderOnConfirm: true 
  }).then(function(input) {
    Swal.fire({ 
      title: 'Welcome to Sync!',
      text: 'Copy the meeting id and share it with others:  ' + urlafterslash,
      imageUrl: 'Sync Logo.png',
      imageWidth: 130,
      imageHeight: 160,
      imageAlt: 'Sync Logo',
      timer: 20000
    });
    toggle_notes() 
    username = input.value.toString();
    arrOfParticipants.push(username) 
    $("#participantsId").append(`<h1 style="color:black; text-indent: 20px;">${username}</h1>`)
    let usernameJoined = username + " has joined the meeting!"
    let usernameJoinedwithyou = "You (" + username + ") have joined the meeting!"
    socket.emit("user_joined", usernameJoined) // for chat
    socket.emit('new_participant', username) // for participants
    $("#chatbox").append(`<li class="message"><i><b style="color:yellow">${usernameJoinedwithyou}</b><i></li>`);
    socket.emit('join-room', room__id, id, username); 
  })
})

socket.emit('join-room', room__id); 

socket.on('add_new_participant', username => {
  if (!arrOfParticipants.includes(username) && username != null && username != "") {
    $("#participantsId").append(`<h1 style="color:black; text-indent: 20px">${username}</h1>`)
    arrOfParticipants.push(username)
  }
})

const leave = () => {
  Swal.fire({
    title: "You have left the meeting",
    text: "Your connection with other peers has been destroyed, you may close this tab!",
    type: "danger",
    width: "70%",
    showCancelButton: false,
    showConfirmButton: false,
    closeOnConfirm: false,
    allowOutsideClick: false
  })
  socket.emit('user_left', peer.id, username)
}

socket.on('left', (data, data2) => {
  const leaveMessage = data2 + " has left the meeting!"
  if (inter2 != leaveMessage) {
    $("#chatbox").append(`<li class="message"><i><b style="color:red">${leaveMessage}</b><i></li>`);
    inter2 = leaveMessage
  }
  rem_from_participants(data2)
  peers[data].close()
})

function userConnection(userId, stream) {
  const call = peer.call(userId, stream) 
  const conn = peer.connect(userId)
  conn.on("open", () => {
    conn.send(arrOfParticipants)
  })
  const video = document.createElement('video') 
  video.style.borderStyle = "solid"
  video.style.borderWidth = "1px"
  video.style.borderColor = "#808080"
  call.on('stream', userStream => {
    addVideo(video, userStream)
  })
  peers[userId] = call 
  call.on('close', () => {
    video.remove() 
  }) 
}

function addVideo(video, stream) {
  video.srcObject = stream; 
  video.addEventListener('loadedmetadata', () => {
      video.play() 
  }) 
  videoGrid.append(video); 
}

const scrollingEnabler = () => {
  let d = $('.chat_window');
  d.scrollTop(d.prop("scrollHeight"));
}

const scrollNotesToBottom = () => {
  let d = $('.notes__window');
  d.scrollTop(d.prop("scrollHeight"));
}

const audioStreaming = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `
    document.querySelector('.mute_button').innerHTML = html;
  } else {
    const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `
    document.querySelector('.mute_button').innerHTML = html;
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
}

const videoStreaming = () => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    const html = `
    <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `
    document.querySelector('.video_button').innerHTML = html;
  } else {
    const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `
    document.querySelector('.video_button').innerHTML = html;
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
}

const chatEnable = () => {
  $("#chatModal").toggle()
  $("#chatModal").draggable()
  $("#chatModal").resizable()
}

socket.on('hide', data => {
  status = 'share'
  //$('video').hide()
})

socket.on("stopShare", (data) => {
  const vid = document.getElementById("share_screen")
  if (vid !== null) {
    vid.remove()
  }
  status = 'join'
  $('video').show()
})

async function screenSharing() {
  let bool = false
  if (bool) {
  } else {
    if (status === 'share') {
      alert("Someone else is already sharing their screen!")
    } else {
      numOfParticipants = arrOfParticipants.length;
      console.log(numOfParticipants)
      captureStream = navigator.mediaDevices.getDisplayMedia({video: true});
      const video = document.createElement('video') 
      video.style.width = "365%"
      video.style.height = "200%"
      video.style.marginLeft = "0px"

      function emitShare() {
        socket.emit("hide_videos","hide videos")
      }
      
      captureStream.then(stream => {
          async function mainShare() {
            await emitShare()
            status = 'share'
            $('video').hide()
            let screenSteam = stream;    
            //socket.emit("justforfun", "freeze")
            addVideo(video, stream); 
          
            for (let key in peers) {
              if (key == null) {
                console.log("NULL")
              } else {
                peer.call(key,stream)
              }
            }
          }
          mainShare() 
          
          stream.getVideoTracks()[0].onended = function () {
            status = "join"
            video.remove()
            $('video').show()
            socket.emit("removeVid", "video")
            //socket.emit("show_videos","show videos")
          };
        });
    }
  }
}

let val = 0
socket.on('confused_or_clear', data => {
  if (val != data) {
    $("#mc").append(`<h6 class="confmsg">${data}</h6>`);
    val = data
  }
})

const indicate = function() {
  $("#myModal").toggle()
  $("#myModal").draggable()
  $("#myModal").resizable();
}

span.onclick = function() {
  modal.style.display = "none";
}

const imclear = () => {
  let msg = username + " is clear"
  let today = new Date();
  let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  let tm = time + ": " + msg; 
  socket.emit("clarity_status", tm)
  $("#mc").append(`<h6 class="confmsg">${tm}</h6>`);
}

socket.on('incrementor', (d1, d2) => {
  num = d2
  document.getElementById("num").innerHTML = d1 + d2
})

const clarity = () => {
  new Swal({ 
    title: 'What are you confused about?',
    input: 'text',
    inputAttributes: {
      autocapitalize: 'off'
    },
    showCancelButton: true,
    confirmButtonText: 'Submit question',
    cancelButtonText: 'Lost in general',
    width: '50%',
    showLoaderOnConfirm: true 
  }).then(function(input) {
    let msg = input.value
    let today = new Date();
    let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    let tm = time + ": " + msg; 
    if (msg !== undefined && msg !== "") {
      socket.emit("clarity_status", tm)
      Swal.fire('Submitted!', '', 'success')
      $("#mc").append(`<h6 class="confmsg">${tm}</h6>`);
    } else {
      let msg = username + " is confused"
      let today = new Date();
      let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
      let tm = time + ": " + msg; 
      socket.emit("clarity_status", tm)
      num++
      let tag = "Number of confused students: " 
      document.getElementById("num").innerHTML = tag + num
      socket.emit("confused_count", tag, num)
      $("#mc").append(`<h6 class="confmsg">${tm}</h6>`);
    } 
  })
}
   
const participants = () => {
  $("#myModal2").toggle()
}

const toggle_notes = () => {
  $("#mr").toggle()
}

const white = () => {
  document.getElementById("mv").style.backgroundColor = "#FFFFFF"
}
const black = () => {
  document.getElementById("mv").style.backgroundColor = "#000000"
}
const blue = () => {
  document.getElementById("mv").style.backgroundColor = "#4F42B5"
}
const pink = () => {
  document.getElementById("mv").style.backgroundColor = "#FFB6C1"
}
const cyan = () => {
  document.getElementById("mv").style.backgroundColor = "#00FFFF"
}
const crimson = () => {
  document.getElementById("mv").style.backgroundColor = "#DC143C"
}

function generatePDF() {
  var doc = new jsPDF();  
    doc.fromHTML(document.getElementById("mr"), 15, 15, {'width': 170},
    function(a) { 
      doc.save("Notes.pdf"); 
    });
}

function ExportToDoc(filename = '') {
  var HtmlHead = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
  var EndHtml = "</body></html>";
  var html = HtmlHead +document.getElementById("unique").innerHTML+EndHtml;
  var blob = new Blob(['\ufeff', html], {
      type: 'application/msword'
  });
  var url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html);
  filename = filename?filename+'.doc':'document.doc';
  var downloadLink = document.createElement("a");
  document.body.appendChild(downloadLink);
  if(navigator.msSaveOrOpenBlob ){
      navigator.msSaveOrOpenBlob(blob, filename);
  } else{
      downloadLink.href = url;
      downloadLink.download = filename;
      downloadLink.click();
  }
  document.body.removeChild(downloadLink);
}

// Recording section

const startRecording = () => {
  Swal.fire('Your video stream is being recorded!')
  recordMsg = "You are recording your video stream!"
  $("#chatbox").append(`<li style="color:green" class="message"><i><b>${recordMsg}</i></li>`);
  recordedBlobs = [];
  let options = { mimeType: "video/webm;codecs=vp9,opus" };
  try {
    mediaRecorder = new MediaRecorder(myVideoStream, options);
  } catch (e) {
    console.error("Exception while creating MediaRecorder:", e);
    userLog("error", "Can't start stream recording: " + e.message);
    return;
  }
  mediaRecorder.onstop = (event) => {
    downloadRecordedStream();
  };
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start();
  console.log("MediaRecorder started", mediaRecorder);
  isStreamRecording = true;   
};

function stopRecording() {
  Swal.fire('You have stopped recording your video stream!')
  recordStopMsg = "You have stopped recording your video stream!"
  $("#chatbox").append(`<li style="color:green" class="message"><b><i>${recordStopMsg}</i></li>`);
  mediaRecorder.stop();
  isStreamRecording = false;
}

function downloadRecordedStream() {
  const recFileName = "myRecording" + "-REC.webm";
  const blob = new Blob(recordedBlobs, { type: "video/webm" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = recFileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}

function handleDataAvailable(event) {
  console.log("handleDataAvailable", event);
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

let video = document.createElement('video');
function invokeGetDisplayMedia(success, error) {
  var displaymediastreamconstraints = {
      video: {
          displaySurface: 'monitor', 
          logicalSurface: true,
          cursor: 'always' 
      }
  };
  displaymediastreamconstraints = {
      video: true
  };
  if (navigator.mediaDevices.getDisplayMedia) {
      navigator.mediaDevices.getDisplayMedia(displaymediastreamconstraints).then(success).catch(error);
  }
  else {
      navigator.getDisplayMedia(displaymediastreamconstraints).then(success).catch(error);
  }
}

function captureScreen(callback) {
  invokeGetDisplayMedia(function(screen) {
      addStreamStopListener(screen, function() {
          document.getElementById('stop').click();
      });
      callback(screen);
  }, function(error) {
      console.error(error);
      alert('Unable to capture your screen. Please check console logs.\n' + error);
  });
}

function stopRecordingCallback() {
  video.src = video.srcObject = null;
  video.src = URL.createObjectURL(recorder.getBlob());    
  recorder.screen.stop();
  saveAs(recorder.getBlob(), `Video-${Date.now()}.webm`);
  recorder = null;
  document.getElementById('record').disabled = false;
}

var recorder; 
const record = function() {
  this.disabled = true;
  captureScreen(function(screen) {
      Swal.fire('Your screen is being recorded!')
      recordMsg = "You are recording your screen!"
      $("#chatbox").append(`<li style="color:green" class="message"><b><i>${recordMsg}</i></li>`);
      video.srcObject = screen;
      recorder = RecordRTC(screen, {
        type: 'video'
      });
      recorder.startRecording();
      recorder.screen = screen;
      document.getElementById('stop').disabled = false;
  });
};

const stop = function() {
  Swal.fire('Screen recording stopped!')
  recordStopMsg = "You have stopped recording your screen!"
  $("#chatbox").append(`<li style="color:green" class="message"><i><b>${recordStopMsg}</i></li>`);
  this.disabled = true;
  recorder.stopRecording(stopRecordingCallback);
};

function addStreamStopListener(stream, callback) {
  stream.addEventListener('ended', function() {
      callback();
      callback = function() {};
  }, false);
  stream.addEventListener('inactive', function() {
      callback();
      callback = function() {};
  }, false);
  stream.getTracks().forEach(function(track) {
      track.addEventListener('ended', function() {
          callback();
          callback = function() {};
      }, false);
      track.addEventListener('inactive', function() {
          callback();
          callback = function() {};
      }, false);
  });
}

// http://localhost:3030/adc372cb-8cc1-4624-a872-4f70175a76c2
// https://salty-river-80456.herokuapp.com/



