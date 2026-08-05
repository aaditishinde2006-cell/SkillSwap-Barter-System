// Skillswap Final App
(function(){
  let pendingToEmail=null;
  let activeChatFriend=null;

  const nameInput=document.getElementById("name");
  const emailInput=document.getElementById("email");
  const skillHave=document.getElementById("skill-have");
  const skillWant=document.getElementById("skill-want");
  const bio=document.getElementById("bio");
  const profilePreview=document.getElementById("profile-preview");
  const clearBtn=document.getElementById("clear-profile");

  const searchBox=document.getElementById("search-box");
  const profilesList=document.getElementById("profiles-list");
  const requestsList=document.getElementById("requests-list");
  const friendsList=document.getElementById("friends-list");

  const requestModal=document.getElementById("request-modal");
  const chatModal=document.getElementById("chat-modal");
  const chatWith=document.getElementById("chat-with");
  const chatMessages=document.getElementById("chat-messages");
  const chatInput=document.getElementById("chat-input");

  const callModal=document.getElementById("call-modal");
  const callStatus=document.getElementById("call-status");
  const localVideo=document.getElementById("localVideo");
  const remoteVideo=document.getElementById("remoteVideo");

  // Storage
  function getProfiles(){return JSON.parse(localStorage.getItem("profiles")||"[]")}
  function saveProfiles(arr){localStorage.setItem("profiles",JSON.stringify(arr))}
  function getRequests(){return JSON.parse(localStorage.getItem("requests")||"[]")}
  function saveRequests(arr){localStorage.setItem("requests",JSON.stringify(arr))}
  function getChats(){return JSON.parse(localStorage.getItem("chats")||"{}")}
  function saveChats(obj){localStorage.setItem("chats",JSON.stringify(obj))}

  function getMyProfile(){
    const meEmail=localStorage.getItem("my_email");
    if(!meEmail) return null;
    return getProfiles().find(p=>p.email===meEmail);
  }

  function showProfile(p){
    if(!p){profilePreview.innerHTML="<em>No profile</em>";return;}
    profilePreview.innerHTML=`<b>${p.name}</b> (${p.email})<br>
      Skills: ${p.skillHave||"—"} → ${p.skillWant||"—"}<br>${p.bio||""}`;
  }

  // Profile Form
  document.getElementById("profile-form").onsubmit=e=>{
    e.preventDefault();
    const p={name:nameInput.value,email:emailInput.value.toLowerCase(),
      skillHave:skillHave.value,skillWant:skillWant.value,bio:bio.value};
    let all=getProfiles().filter(x=>x.email!==p.email);
    all.push(p);saveProfiles(all);
    localStorage.setItem("my_email",p.email);
    showProfile(p);renderProfiles();renderRequests();renderFriends();
    alert("Profile saved");
  };
  clearBtn.onclick=()=>{localStorage.removeItem("my_email");showProfile(null)};
  showProfile(getMyProfile());

  // Friend Request
  function openRequestModal(toEmail,toName){
    pendingToEmail=toEmail;
    document.getElementById("request-to").textContent=`To: ${toName} (${toEmail})`;
    document.getElementById("request-message").value="";
    requestModal.classList.remove("hidden");
  }
  document.getElementById("send-request-btn").onclick=()=>{
    const me=getMyProfile();if(!me)return alert("Save profile first!");
    const msg=document.getElementById("request-message").value.trim();
    const reqs=getRequests();
    reqs.push({from:me.email,to:pendingToEmail,status:"pending",message:msg});
    saveRequests(reqs);
    requestModal.classList.add("hidden");
    alert("Friend request sent!");
    renderProfiles();
  };
  document.getElementById("cancel-request-btn").onclick=()=>{requestModal.classList.add("hidden")};

  function renderRequests(){
    const me=getMyProfile();requestsList.innerHTML="";if(!me)return;
    const reqs=getRequests().filter(r=>r.to===me.email && r.status==="pending");
    reqs.forEach(r=>{
      const li=document.createElement("li");
      li.innerHTML=`<div>
        <b>${r.from}</b> wants to connect<br>
        <span class="muted">${r.message||""}</span>
      </div>`;
      const accept=document.createElement("button");
      accept.textContent="Accept";
      accept.onclick=()=>{
        r.status="accepted";saveRequests(getRequests());
        // Save initial message into chat
        if(r.message){
          const chats=getChats();const key=[me.email,r.from].sort().join("|");
          chats[key]=chats[key]||[];
          chats[key].push({from:r.from,text:r.message});
          saveChats(chats);
        }
        renderRequests();renderFriends();
      };
      const decline=document.createElement("button");decline.textContent="Decline";decline.className="danger";
      decline.onclick=()=>{r.status="declined";saveRequests(getRequests());renderRequests()};
      li.appendChild(accept);li.appendChild(decline);requestsList.appendChild(li);
    });
  }
  renderRequests();

  // Profiles
  function renderProfiles(){
    const all=getProfiles();
    const me=getMyProfile();
    const q=searchBox.value.toLowerCase();
    profilesList.innerHTML="";
    all.forEach(p=>{
      if(me && p.email===me.email)return;
      if(q && !(p.name.toLowerCase().includes(q)||p.email.includes(q)||(p.skillHave||"").toLowerCase().includes(q)||(p.skillWant||"").toLowerCase().includes(q)))return;
      const li=document.createElement("li");
      li.innerHTML=`<div><b>${p.name}</b> (${p.email})<br>${p.skillHave||"—"} → ${p.skillWant||"—"}</div>`;
      const btn=document.createElement("button");
      btn.textContent="Add Friend"; btn.onclick=()=>openRequestModal(p.email,p.name);
      li.appendChild(btn);profilesList.appendChild(li);
    });
  }
  searchBox.oninput=renderProfiles;renderProfiles();

  // Friends
  function renderFriends(){
    const me=getMyProfile();friendsList.innerHTML="";if(!me)return;
    const reqs=getRequests().filter(r=>(r.from===me.email||r.to===me.email)&&r.status==="accepted");
    if(reqs.length===0){friendsList.innerHTML="<li><em>No friends yet</em></li>";return;}
    reqs.forEach(r=>{
      const friendEmail=r.from===me.email? r.to:r.from;
      const friend=getProfiles().find(p=>p.email===friendEmail);
      const li=document.createElement("li");
      li.innerHTML=`<div><b>${friend?friend.name:friendEmail}</b> (${friendEmail})</div>`;
      const chatBtn=document.createElement("button"); chatBtn.textContent="Message"; chatBtn.onclick=()=>openChat(friendEmail);
      li.appendChild(chatBtn);
      const voice=document.createElement("button"); voice.textContent="Voice Call"; voice.onclick=()=>startCall(friendEmail,"voice");
      const video=document.createElement("button"); video.textContent="Video Call"; video.onclick=()=>startCall(friendEmail,"video");
      li.appendChild(voice); li.appendChild(video);
      friendsList.appendChild(li);
    });
  }
  renderFriends();

  // Chat
  function openChat(friendEmail){
    activeChatFriend=friendEmail;
    chatWith.textContent="Chat with "+friendEmail;
    chatModal.classList.remove("hidden");
    renderChat();
  }
  function renderChat(){
    chatMessages.innerHTML="";
    const chats=getChats();const me=getMyProfile();
    if(!me || !activeChatFriend)return;
    const key=[me.email,activeChatFriend].sort().join("|");
    (chats[key]||[]).forEach(m=>{
      const div=document.createElement("div");
      div.innerHTML=`<b>${m.from}:</b> ${m.text}`;
      chatMessages.appendChild(div);
    });
    chatMessages.scrollTop=chatMessages.scrollHeight;
  }
  document.getElementById("send-chat-btn").onclick=()=>{
    const text=chatInput.value.trim();if(!text)return;
    const chats=getChats();const me=getMyProfile();
    const key=[me.email,activeChatFriend].sort().join("|");
    chats[key]=chats[key]||[];
    chats[key].push({from:me.email,text});saveChats(chats);
    chatInput.value="";renderChat();
  }
  document.getElementById("close-chat-btn").onclick=()=>{chatModal.classList.add("hidden")};

  // Call UI (WebRTC setup requires signaling server)
  function startCall(friendEmail,type){
    callModal.classList.remove("hidden");callStatus.textContent=type+" call with "+friendEmail;
    // Here you integrate WebRTC and signaling
  }
  document.getElementById("end-call-btn").onclick=()=>{callModal.classList.add("hidden")};

})();

      
