
// tema salvo

const toggle = document.getElementById("themeToggle")

if(localStorage.getItem("theme")==="dark"){

document.body.classList.add("dark")

}

toggle?.addEventListener("click",()=>{

document.body.classList.toggle("dark")

if(document.body.classList.contains("dark")){

localStorage.setItem("theme","dark")

}else{

localStorage.setItem("theme","light")

}

})


// mostrar senha

document.querySelectorAll(".eye").forEach(icon=>{

icon.addEventListener("click",()=>{

const input = icon.previousElementSibling

if(input.type==="password"){

input.type="text"
icon.textContent="🙈"

}else{

input.type="password"
icon.textContent="👁"

}

})

})