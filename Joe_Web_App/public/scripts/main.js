/**
 * @fileoverview
 * Provides interactions for all pages in the UI.
 *
 * @author  Hannah Woody
 */


/** namespace. */
var rh = rh || {};

/** globals */
rh.COLLECTION_COFFEEMAKERS = "CoffeeMakers";
rh.KEY_NAME = "Name";
rh.KEY_LAST_TOUCHED = "lastUsed";
rh.KEY_UID = "uid";
rh.KEY_IS_BREWING = "isBrewing";
rh.KEY_SCHEDULE_TIME = "scheduleBrewTime";
rh.KEY_DELETE_TIME = "deleteBrewTime";
rh.KEY_SCHEDULES = "schedules"

rh.schedules = [];

// rh.ROSEFIRE_REGISTRY_TOKEN = "056cedef-84f2-4442-ad87-3ec162004924";

rh.fbCoffeeMakersManager = null;
rh.fbSingleCoffeeMakerManager = null;
rh.fbAuthManager = null;

rh.CoffeeMaker = class {
	constructor(id, name, isBrewing, uid) {
		this.id = id;
		this.name = name;
		this.isBrewing = isBrewing;
		this.uid = uid;
	}
}

rh.FbCoffeeMakersManager = class {
	constructor(uid) {
		this._ref = firebase.firestore().collection(rh.COLLECTION_COFFEEMAKERS);
		this._documentSnapshots = [];
		this._unsubscribe = null;
		this._uid = uid;
		console.log("id is ", uid);
	}

	beginListening(changeListener) {
		console.log("Listening for coffee makers");
		let query = this._ref.orderBy(rh.KEY_LAST_TOUCHED, "desc").limit(30);
		if (this._uid) {
			query = query.where(rh.KEY_UID, "==", this._uid);
		}
		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;
			console.log("Update " + this._documentSnapshots.length + " coffee makers");
			// querySnapshot.forEach( (doc) => {
			// 	console.log(doc.data());
			// });
			if (changeListener) {
				changeListener();
			}
		});
	}

	stopListening() {
		this._unsubscribe();
	}

	add(name) {
		this._ref.add({
			[rh.KEY_NAME]: name,
			[rh.KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
			[rh.KEY_UID]: rh.fbAuthManager.uid,
			[rh.KEY_IS_BREWING]: false,
		}).then((docRef) => {
			console.log("Document has been added with id", docRef.id);
		}).catch((error) => {
			console.log("There was an error adding the document", error);
		});
	}
	get length() {
		return this._documentSnapshots.length;
	}
	getCoffeeMakerAtIndex(index) {
		return new rh.CoffeeMaker(
			this._documentSnapshots[index].id,
			this._documentSnapshots[index].get(rh.KEY_NAME),
			this._documentSnapshots[index].get(rh.KEY_IS_BREWING),
			this._documentSnapshots[index].get(rh.KEY_UID)
		);
	}
}

rh.ListPageController = class {
	constructor() {


		rh.fbCoffeeMakersManager.beginListening(this.updateView.bind(this));
		$("#menuMyCoffeeMakers").click((event)=>{
			console.log("show only my coffee makers, uid: ",rh.fbAuthManager.uid);
			window.location.href = 	`/MainPage.html?uid=${rh.fbAuthManager.uid}`;
		});

		$("#menuAllCoffeeMakers").click((event)=>{
			console.log("show all coffee makers");
			window.location.href = 	`/MainPage.html`;
		});
		
		$("#emailModal").on("shown.bs.modal", function (e) {
			$("#emailJoeButton").trigger("focus");
		});
		$("#menuSignOut").click((event) => {
			console.log("Sign out.");
			rh.fbAuthManager.signOut();
		});
		$("#addCoffeeMakerDialog").on("shown.bs.modal", function (e) {
			$("#inputCoffeeMaker").trigger("focus");
		});
		$("#submitAddCoffeeMaker").click((event) => {
			const name = $("#inputCoffeeMaker").val();
			rh.fbCoffeeMakersManager.add(name);
			$("#inputCoffeeMaker").val("");
		});
	}

	updateView() {
		$("#coffeeMakerList").removeAttr("id").hide();
		let $newList = $("<ul></ul>").attr("id", "coffeeMakerList").addClass("list-group");

		for (let k = 0; k < rh.fbCoffeeMakersManager.length; k++) {
			const $newCard = this.createCoffeeMakerCard(
				rh.fbCoffeeMakersManager.getCoffeeMakerAtIndex(k)
			);
			$newList.append($newCard);
		}
		$("#coffeeListContainer").append($newList);
	}

	createCoffeeMakerCard(coffeeMaker) {
		var status = "Available";
		var buttonType = "btn-success";
		if (coffeeMaker.isBrewing) {
			status = "Brewing";
			buttonType = "btn-danger"
		}
		const $newCard = $(`
		  <li id="${coffeeMaker.id}" class="coffee-maker-card list-group-item">
		     <div class="coffee-maker-card-name">${coffeeMaker.name}<button class="btn ${buttonType} float-right">${status}</button></div>
		     
		  </li>`);
		  
			//   <div class="coffee-maker-card-ipAddress text-right blockquote-footer">${coffeeMaker.ipAddress}</div>

		$newCard.click((event) => {
			console.log("You have clicked", coffeeMaker.uid, rh.fbAuthManager.uid);
			if(coffeeMaker.uid==rh.fbAuthManager.uid){
				window.location.href = `/CoffeeMaker.html?id=${coffeeMaker.id}`;
			}
			
		});
		return $newCard;
	}
}

rh.FbSingleCoffeeMakerManager = class {
	constructor(coffeeMakerId) {
		// console.log(coffeeMakerId);
		this._ref = firebase.firestore().collection(rh.COLLECTION_COFFEEMAKERS).doc(coffeeMakerId);
		this._document = {};
		this._unsubscribe = null;
		
	}

	beginListening(changeListener) {
		console.log("Listening for this coffee maker");
		this._unsubscribe = this._ref.onSnapshot((doc) => {
			if (doc.exists) {
				this._document = doc;
				console.log('doc.data() :', doc.data());
				if (changeListener) {
					changeListener();
				}
			} else {
				// This document does not exist (or has been deleted)
				//window.location.href = "/";

			}
		});
	}

	stopListening() {
		this._unsubscribe();
	}

	update(name, isBrewing) {
		this._ref.update({
			[rh.KEY_NAME]: name,
			[rh.KEY_IS_BREWING]: isBrewing,
			[rh.KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now()
		}).then((docRef) => {
			console.log("The update is complete");
		});
	}

	updateSchedule(scheduleBrewTime){
		this._ref.update(
			{[rh.KEY_SCHEDULE_TIME]: scheduleBrewTime,
			}).then((docRef)=>{
				console.log("Upate Schdule: ",scheduleBrewTime);
			});
	}

	delete() {
		return this._ref.delete();
	}

	deleteUser(index){
		for(let k=0;k<this.users.length;k++){
			if(index==k){
				// this._ref.update({[Users + ]: firebase.firestore.FieldValue.delete()});
			}
		}
	}

	get name() {		
		return this._document.get(rh.KEY_NAME);
	}

	get uid() {
		return this._document.get(rh.KEY_UID);
	}

	get isBrewing() {
		return this._document.get(rh.KEY_IS_BREWING);
	}

	get schedules(){
		return this._document.get(rh.KEY_SCHEDULES);
	}
	
	setSchedule(){
		this._ref.update({[rh.KEY_SCHEDULES]:rh.schedules});
	}
}


// TODO: implement single coffee maker pages
rh.DetailPageController = class {
	constructor() {
		
		rh.fbSingleCoffeeMakerManager.beginListening(this.updateView.bind(this));
		

		$("#editCoffeeMakerDialog").on("show.bs.modal", function (e) {
			$("#inputCoffeeMaker").val(rh.fbSingleCoffeeMakerManager.name);
		});
		$("#editCoffeeMakerDialog").on("shown.bs.modal", function (e) {
			$("#inputCoffeeMaker").trigger("focus");
		});
		$("#menuSignOut").click((event) => {
			console.log("Sign out.");
			rh.fbAuthManager.signOut();
		});

		$("#menuMyCoffeeMakers").click((event)=>{
			console.log("show only my coffee makers, uid: ",rh.fbAuthManager.uid);
			window.location.href = 	`/MainPage.html?uid=${rh.fbAuthManager.uid}`;
		});

		$("#menuAllCoffeeMakers").click((event)=>{
			console.log("show all coffee makers");
			window.location.href = 	`/MainPage.html`;
		});

		
		$("#scheduleButton").click((event)=>{
			let time = document.getElementById("timeInput").value;
			let date = document.getElementById("dateInput").value;
			console.log("schedule coffee by time and date");
			// console.log("schedule "+time);
			// console.log("schedule "+date);
			// date.replace('-','');	
			let schedule = date+"-"+time;
			// schedule = schedule.replace('-','');
			// schedule = schedule.replace(':','');
			rh.fbSingleCoffeeMakerManager.updateSchedule(schedule);
			rh.schedules.unshift(schedule);
			rh.fbSingleCoffeeMakerManager.setSchedule();
			// console.log("array of schedules "+rh.schedules.toString());
		});

		

		
		
		
	
		$("#startBrewingButton").click((event)=>{
			console.log("brew button clicked");
			// document.getElementById("progress").style.width = "0%";
			if (!rh.fbSingleCoffeeMakerManager.isBrewing) {
				$("#startBrewingButton").html("Stop Brewing");
				$("#status").html("Status: Coffee Brewing")
			}
			else {
				$("#startBrewingButton").html("Start Brewing Now");
				$("#status").html("Status: Available")
			}
			console.log("isBrewing = ", rh.fbSingleCoffeeMakerManager.isBrewing);
			rh.fbSingleCoffeeMakerManager.update(rh.fbSingleCoffeeMakerManager.name, !rh.fbSingleCoffeeMakerManager.isBrewing);
		});

		$("#settingsButton").click((event)=>{
			console.log("configure coffee maker settings");
		});


		$("#submitDeleteCoffeeMaker").click((event)=>{
			rh.fbSingleCoffeeMakerManager.delete().then((params)=>{
				console.log("deleted coffee maker");
				window.location.href = "/MainPage.html";
			})
		});
	}

	updateView() {

		rh.schedules = rh.fbSingleCoffeeMakerManager.schedules;
		console.log(rh.schedules);
		$("#cardQuote").html(rh.fbSingleCoffeeMakerManager.quote);
		$("#cardMovie").html(rh.fbSingleCoffeeMakerManager.movie);

		console.log(rh.fbSingleCoffeeMakerManager.name);
		$("#coffeeName").html(rh.fbSingleCoffeeMakerManager.name);
		// $("#coffeeIcon").attr("src","images/coffee_icon.svg");

		if (rh.fbSingleCoffeeMakerManager.isBrewing) {
			console.log("bleh: ", rh.KEY_IS_BREWING);
			$("#startBrewingButton").html("Stop Brewing");
			$("#startBrewingButton").attr("class","btn btn-danger");
			$("#status").html("Status: Coffee Brewing")
		} else {
			$("#startBrewingButton").html("Start Brewing Now");
			$("#startBrewingButton").attr("class","btn btn-success");
			$("#status").html("Status: Available")
		}

		// var timeInput = document.getElementById("timeInput");
		// document.querySelector("div.form-group").addEventListener("#scheduleButton",function(e){
		// 	e.preventDefault();
		// 	console.log(timeInput.value);
		// });

		// let $newList = $("<ul></ul>").attr("id", "queueList").addClass("list-group");

		// for (let k = 0; k < rh.fbSingleCoffeeMakerManager.users.length; k++) {
		// 	const $newUser = this.createUsers(
		// 		rh.fbSingleCoffeeMakerManager.users[k],k
		// 	);
			
		// 	$newList.append($newUser);
		// }
		// $("#usersListContainer").append($newList);

		// for(let index=0;index<rh.fbSingleCoffeeMakerManager.users.length;index++){
		// 	$(`#delete${index}`).click((event)=>{
		// 		console.log(`delete ${index}`,$(`#list${index}`).html());
		// 		rh.fbSingleCoffeeMakerManager.deleteUser(index);
		// 	});
	
		// }

		

		let $newQueueList = $("<ul></ul>").attr("id", "queueList").addClass("list-group");
		for(let index=0;index<rh.schedules.length;index++){
			const $newTime = this.addToQueue(rh.schedules[index],index);
			$newQueueList.append($newTime);
		}
		$("#queueListContainer").append($newQueueList);

		for(let k=0;k<rh.schedules.length;k++){
			$(`#delete${k}`).click((event)=>{
				console.log(`delete${k}`);
				this.deleteFromQueue(k);
				rh.fbSingleCoffeeMakerManager.setSchedule();
			});


		}
		
		// Show edit and delete if allowed.
		if(rh.fbSingleCoffeeMakerManager.uid == rh.fbAuthManager.uid) {
			$("#menuEdit").show();
			$("#menuDelete").show();
		}

	}

	// createUsers(user,index) {
	// 	const $newUser = $(`
	// 	  <li id="list${index}" class="list-group-item">
	// 		 <div>${user} <button id="delete${index}" class="btn btn-danger float-right">Delete User</button> </div>	 
	// 	  </li>`);

		  
			  
	// 	return $newUser;
	// }

	addToQueue(time,index){
		const newTime = $(`
			<li id="time${index}" class="list-group-item">
				<div> ${time} <button id="delete${index}" class="btn myDeleteButton btn-danger float-right">Remove From Queue</button></div>
			</li>
		`);
		// console.log(newTime);
		return newTime;
	}

	deleteFromQueue(index){
		console.log("before " + rh.schedules);
		if(index==rh.schedules.length){
			rh.schedules.pop();
		}
		for(let k=0;k<rh.schedules;k++){
			if(k===index){
				rh.schedules.splice(k,1);
			}
		}
		console.log("after " + rh.schedules);
	}

	

}

function inputChange(e){
	console.log(document.getElementById("timeInput").value);
	console.log(document.getElementById("dateInput").value);
}

rh.FbAuthManager = class {
	constructor() {
		this._user = null;
		// this.uid = null;
		// this.isSignIn = false;
	}
	get uid() {
		if (this._user) {
			return this._user.uid;
		}
		console.log("There is no user!");
		return "";
	}

	get isSignIn() {
		return !!this._user;
	}

	beginListening(changeListener) {
		console.log("Listen for auth state changes");
		firebase.auth().onAuthStateChanged((user) => {
			this._user = user;
			changeListener();
		});
	}
	
	signIn() {
		// const username = new mdc.textField.MDCTextField(document.querySelector('.email'));
		// const password = new mdc.textField.MDCTextField(document.querySelector('.password'));
	
		$("#login").click((event) => {
			console.log("TODO: Log in an existing user");
			const emailValue = $("#email-input").val();
			const passwordValue = $("#password-input").val();
			console.log("Sign in a new user", emailValue, passwordValue);
			firebase.auth().signInWithEmailAndPassword(emailValue, passwordValue).catch(function(error) {
				// CONSIDER: In a real app tell the user what is wrong.
				console.log(`Error ${error.code}: ${error.message}`);
			  });
		});
	};

	createAccount() {
		// const username = new mdc.textField.MDCTextField(document.querySelector('.email'));
		// const password = new mdc.textField.MDCTextField(document.querySelector('.password'));

		$("#submitNewAccount").click((event) => {
			const emailValue = $("#InputCreateEmail").val();
			const passwordValue = $("#InputCreatePassword").val();
			console.log("Create a new user", emailValue, passwordValue);
			firebase.auth().createUserWithEmailAndPassword(emailValue, passwordValue).catch(function(error) {
				// CONSIDER: In a real app tell the user what is wrong.
				console.log(`Error ${error.code}: ${error.message}`);
			  });
		});

	}

	signOut() {
		firebase.auth().signOut();
	}
}

rh.LoginPageController = class {
	constructor() {
		$("#login").click((event) => {
			rh.fbAuthManager.signIn();
		});
		$("#createAccount").click((event) => {
			$("#loginForm").hide();
			$("#createAccountForm").show();
		});
		$("#submitNewAccount").click((event) => {
			rh.fbAuthManager.createAccount();
		});
	}
}

rh.checkForRedirects = function () {
	// Redirects
	if ($("#login-page").length && rh.fbAuthManager.isSignIn) {
		window.location.href = "/MainPage.html";
	}
	if (!$("#login-page").length && !rh.fbAuthManager.isSignIn) {
		window.location.href = "/";
	}
}

rh.initializePage = function () {
	// Initialization
	var urlParams = new URLSearchParams(window.location.search);
	if ($("#list-page").length) {
		console.log("On the list page");
		const urlUid = urlParams.get('uid');
		console.log(urlUid);
		rh.fbCoffeeMakersManager = new rh.FbCoffeeMakersManager(urlUid);
		new rh.ListPageController();
	} else if ($("#detail-page").length) {
		console.log("On the detail page");
		
		const coffeeMakerId = urlParams.get('id');
		if (coffeeMakerId) {
			rh.fbSingleCoffeeMakerManager = new rh.FbSingleCoffeeMakerManager(coffeeMakerId);
			new rh.DetailPageController();
		} else {
			console.log("Missing a coffee maker id");
			window.location.href = "/MainPage.html";
		}
	} else if ($("#login-page").length) {
		console.log("On the login page.");
		new rh.LoginPageController();
	}
}

/* Main */
$(document).ready(() => {
	console.log("Ready");
	rh.fbAuthManager = new rh.FbAuthManager();
	$("#createAccountForm").hide();
	rh.fbAuthManager.beginListening(() => {
		console.log("Auth state changed. isSignedIn = ", rh.fbAuthManager.isSignIn);
		rh.checkForRedirects();
		rh.initializePage();
	});
});