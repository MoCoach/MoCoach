"use strict";
const USER_PROFILE_DATA = {
  username: 'username',
  firstName: '',
  lastName: '',
  email: '',
  city: '',
  password: '',
  avatar: '',
};


const UserProfileApp = {
  data: null,

  init() {
    if (!document.getElementById('user-profile-card')) {
      setTimeout(() => this.init(), 50);
      return;
    }

    try {
      const savedUser = localStorage.getItem('mocoach_user');

      if (savedUser) {
        this.data = JSON.parse(savedUser);
      } else {
        this.data = JSON.parse(JSON.stringify(USER_PROFILE_DATA));
      }

    } catch (err) {
      console.error("User profile loading error", err);
      this.data = JSON.parse(JSON.stringify(USER_PROFILE_DATA));
    }


    this.render();
    this.bindEvents();
  },


  render() {
    this.renderHeader();
    this.renderPersonalInfo();

    if (window.lucide) lucide.createIcons();
  },


  renderHeader() {

    const el = document.getElementById('user-profile-card');

    if (!el) return;

    const d = this.data;


    el.innerHTML = `

    <div class="flex flex-col md:flex-row items-center gap-6">

      <div class="relative">

        <div class="w-32 h-32 rounded-full overflow-hidden border-4 border-teal-500/30">

          <img 
          src="${d.avatar || 'assets/img/default-user.png'}"
          class="w-full h-full object-cover"
          >

        </div>


      </div>


      <div>

        <p class="text-teal-400 text-xl font-bold">
        @${d.username || 'username'}
        </p>


        <p class="text-slate-300">
        ${d.firstName || ''} ${d.lastName || ''}
        </p>


      </div>


      <div class="ml-auto flex gap-3">


      <button 
      onclick="UserProfileApp.scrollToEdit()"
      class="bg-teal-600 px-5 py-2 rounded-xl">

      Edit Profile

      </button>


      <button
      onclick="UserProfileApp.logout()"
      class="bg-red-700 px-5 py-2 rounded-xl">

      Logout

      </button>


      </div>


    </div>

    `;
  },




  renderPersonalInfo() {


    const el = document.getElementById('user-profile-form');

    if (!el) return;


    const d = this.data;


    el.innerHTML = `


    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">


    ${this.createInput(
      'username',
      'Username',
      d.username
    )}


    ${this.createInput(
      'firstName',
      'First Name',
      d.firstName
    )}


    ${this.createInput(
      'lastName',
      'Last Name',
      d.lastName
    )}


    ${this.createInput(
      'email',
      'Email Address',
      d.email
    )}


    ${this.createInput(
      'city',
      'City',
      d.city
    )}


    ${this.createInput(
      'password',
      'Password',
      '',
      'password'
    )}



    ${this.createInput(
      'confirmPassword',
      'Confirm Password',
      '',
      'password'
    )}



    </div>



    <div class="mt-6">


    <label class="block text-white mb-2">
    Profile Photo
    </label>


    <input 
    id="profile-photo"
    type="file"
    accept="image/*"
    class="text-white"
    >



    </div>



    <button
    onclick="UserProfileApp.saveProfile()"
    class="mt-6 bg-teal-600 px-8 py-3 rounded-xl">

    Save Changes

    </button>


    `;


  },



  createInput(id,label,value,type="text") {


    return `

    <div>

    <label class="text-white block mb-2">
    ${label}
    </label>


    <input

    id="user-${id}"

    type="${type}"

    value="${value || ''}"

    class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white"

    >

    </div>


    `;


  },





  saveProfile(){


    const password =
    document.getElementById('user-password').value;


    const confirmPassword =
    document.getElementById('user-confirmPassword').value;



    if(password !== confirmPassword){

      alert("Passwords do not match");
      return;

    }




    this.data.username =
    document.getElementById('user-username').value;


    this.data.firstName =
    document.getElementById('user-firstName').value;


    this.data.lastName =
    document.getElementById('user-lastName').value;


    this.data.email =
    document.getElementById('user-email').value;


    this.data.city =
    document.getElementById('user-city').value;



    const photo =
    document.getElementById('profile-photo').files[0];


    if(photo){

      const reader = new FileReader();


      reader.onload = (e)=>{

        this.data.avatar = e.target.result;


        localStorage.setItem(
        'mocoach_user',
        JSON.stringify(this.data)
        );


        this.renderHeader();

      };


      reader.readAsDataURL(photo);

    }else{


      localStorage.setItem(
      'mocoach_user',
      JSON.stringify(this.data)
      );


      this.renderHeader();

    }



    alert("Profile updated successfully");

  },




  logout(){

    localStorage.removeItem('mocoach_user');

    window.location.reload();

  },




  scrollToEdit(){

    const el =
    document.getElementById('user-profile-form');


    if(el){

      el.scrollIntoView({
        behavior:'smooth'
      });

    }

  },



  bindEvents(){

  }


};



if(document.readyState === "loading"){

document.addEventListener(
"DOMContentLoaded",
()=>UserProfileApp.init()
);


}else{

UserProfileApp.init();

}



window.UserProfileApp = UserProfileApp;