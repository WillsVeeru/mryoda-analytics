/* UI-only sign-in prototype. No credential transmission, storage or simulated authentication. */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id),form=$('analyticsLogin'),username=$('loginUsername'),password=$('loginPassword'),toggle=$('loginPasswordToggle'),message=$('loginMessage'),help=$('loginHelpDialog');
  document.querySelectorAll('[data-auth-icon]').forEach(element=>{element.innerHTML=window.dashboardIcon(element.dataset.authIcon);});
  function resetVisibility(){password.type='password';toggle.textContent='Show';toggle.setAttribute('aria-label','Show password');toggle.setAttribute('aria-pressed','false');$('loginCapsLock').hidden=true;}
  function fieldError(field,text){const error=$(field.id+'Error');field.setAttribute('aria-invalid',String(!!text));error.textContent=text;error.hidden=!text;}
  function clearMessage(){message.hidden=true;message.textContent='';}
  toggle.addEventListener('click',()=>{const visible=password.type==='password';password.type=visible?'text':'password';toggle.textContent=visible?'Hide':'Show';toggle.setAttribute('aria-label',visible?'Hide password':'Show password');toggle.setAttribute('aria-pressed',String(visible));});
  for(const field of [username,password])field.addEventListener('input',()=>{fieldError(field,'');clearMessage();});
  for(const event of ['keydown','keyup'])password.addEventListener(event,event=>{$('loginCapsLock').hidden=!event.getModifierState?.('CapsLock');});
  password.addEventListener('blur',()=>{$('loginCapsLock').hidden=true;});
  form.addEventListener('submit',event=>{
    event.preventDefault();clearMessage();
    const missingUsername=!username.value.trim(),missingPassword=!password.value;
    fieldError(username,missingUsername?'Enter your staff ID or email.':'');fieldError(password,missingPassword?'Enter your password.':'');
    if(missingUsername||missingPassword){(missingUsername?username:password).focus();return;}
    password.value='';resetVisibility();
    message.textContent='Sign-in is not connected yet. Use the dashboard preview to explore this prototype.';message.hidden=false;message.focus();
  });
  $('loginHelp').addEventListener('click',()=>help.showModal());
  $('loginHelpClose').addEventListener('click',()=>help.close());$('loginHelpDone').addEventListener('click',()=>help.close());
  help.addEventListener('click',event=>{if(event.target!==help)return;const rect=help.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)help.close();});
  window.addEventListener('pagehide',()=>{password.value='';resetVisibility();});
})();
