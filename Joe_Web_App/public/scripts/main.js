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
rh.KEY_IPADDRESS = "IPAddress";
rh.KEY_LAST_TOUCHED = "lastUsed";
rh.KEY_UID = "uid";

rh.ROSEFIRE_REGISTRY_TOKEN = "056cedef-84f2-4442-ad87-3ec162004924";

rh.fbCoffeeMakersManager = null;
rh.fbSingleCoffeeMakerManager = null;
rh.fbAuthManager = null;

rh.CoffeeMaker = class {
	constructor(id, name, ipAddress) {
		this.id = id;
		this.name = name;
		this.ipAddress = ipAddress;
	}
}

rh.FbCoffeeMakersManager = class {
	constructor(uid) {
		this._ref = firebase.firestore().collection(rh.COLLECTION_COFFEEMAKERS);
		this._documentSnapshots = [];
		this._unsubscribe = null;
		this._uid = uid;
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

	add(name, ipAddress) {
		this._ref.add({
			[rh.KEY_NAME]: name,
			[rh.KEY_IPADDRESS]: ipAddress,
			[rh.KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
			[rh.KEY_UID]: rh.fbAuthManager.uid,
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
			this._documentSnapshots[index].get(rh.KEY_IPADDRESS)
		);
	}
}

rh.ListPageController = class {
	constructor() {
		rh.fbCoffeeMakersManager.beginListening(this.updateView.bind(this));
		$("#settingModal").on("shown.bs.modal", function (e) {
			$("#settingCloseButton").trigger("focus");
		});
		$("#helpModal").on("shown.bs.modal", function (e) {
			$("#helpCloseButton").trigger("focus");
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
			const ipAddress = $("#inputIPAddress").val();
			rh.fbCoffeeMakersManager.add(name, ipAddress);
			$("#inputCoffeeMaker").val("");
			$("#inputIPAddress").val("");
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
		const $newCard = $(`
		  <li id="${coffeeMaker.id}" class="coffee-maker-card list-group-item">
		     <div class="coffee-maker-card-name">${coffeeMaker.name}</div>
		     
		  </li>`);
		  
			//   <div class="coffee-maker-card-ipAddress text-right blockquote-footer">${coffeeMaker.ipAddress}</div>

		$newCard.click((event) => {
			console.log("You have clicked", coffeeMaker);
			window.location.href = `/CoffeeMaker.html?id=${coffeeMaker.id}`;
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

	update(name, ipAdress) {
		this._ref.update({
			[rh.KEY_NAME]: name,
			[rh.KEY_IPADDRESS]: ipAdress,
			[rh.KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now()
		}).then((docRef) => {
			console.log("The update is complete");
		});
	}
	delete() {
		return this._ref.delete();
	}

	get name() {		
		return this._document.get(rh.KEY_NAME);
	}

	get ipAddress() {
		return this._document.get(rh.KEY_IPADDRESS);
	}

	get uid() {
		return this._document.get(rh.KEY_UID);
	}
}


// TODO: implement single coffee maker pages
rh.DetailPageController = class {
	constructor() {
		rh.fbSingleCoffeeMakerManager.beginListening(this.updateView.bind(this));
		
		$("#editCoffeeMakerDialog").on("show.bs.modal", function (e) {
			$("#inputCoffeeMaker").val(rh.fbSingleCoffeeMakerManager.name);
			$("#inputIPAddress").val(rh.fbSingleCoffeeMakerManager.ipAddress);
		});
		$("#editCoffeeMakerDialog").on("shown.bs.modal", function (e) {
			$("#inputCoffeeMaker").trigger("focus");
		});
		$("#menuSignOut").click((event) => {
			console.log("Sign out.");
			rh.fbAuthManager.signOut();
		});

		$("#scheduleButton").click((event)=>{
			console.log("schedule coffee by time and date");
			console.log("schedule "+document.getElementById("timeInput").value);
			console.log("schedule "+document.getElementById("dateInput").value);	
		});
	
		$("#startBrewingButton").click((event)=>{
			console.log("start brewing now");
			document.getElementById("progress").style.width = "0%";

		});

		$("#settingsButton").click((event)=>{
			console.log("configure coffee maker settings");
		});

		//Make the title the coffee maker name
		
		

		// TODO: implement edit coffee maker
		// $("#submitEditQuote").click((event) => {
		// 	const name = $("#inputCoffeeMaker").val();
		// 	const ipAddress = $("#inputIPAddress").val();
		// 	rh.fbSingleCoffeeMakerManager.update(name, ipAddress);
		// });

		// TODO: implement delete coffee maker
		// $("#deleteQuote").click((event) => {
		// 	rh.fbSingleCoffeeMakerManager.delete().then(() => {
		// 		window.location.href = "/MainPage.html";
		// 	});
		// });

	}

	updateView() {
		$("#cardQuote").html(rh.fbSingleCoffeeMakerManager.quote);
		$("#cardMovie").html(rh.fbSingleCoffeeMakerManager.movie);

		console.log(rh.fbSingleCoffeeMakerManager.name);
		$("#coffeeName").html(rh.fbSingleCoffeeMakerManager.name);
		// $("#coffeeIcon").attr("src","images/coffee_icon.svg");

				
		

		// var timeInput = document.getElementById("timeInput");
		// document.querySelector("div.form-group").addEventListener("#scheduleButton",function(e){
		// 	e.preventDefault();
		// 	console.log(timeInput.value);
		// });

		// Show edit and delete if allowed.
		if(rh.fbSingleCoffeeMakerManager.uid == rh.fbAuthManager.uid) {
			$("#menuEdit").show();
			$("#menuDelete").show();
		}

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