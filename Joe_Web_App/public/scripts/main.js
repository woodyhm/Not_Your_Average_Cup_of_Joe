/**
 * @fileoverview
 * Provides interactions for all pages in the UI.
 *
 * @author  Hannah Woody
 */


/** namespace. */
var rh = rh || {};

/** globals */
rh.COLLECTION_MOVIEQUOTES = "MovieQuotes";
rh.KEY_QUOTE = "quote";
rh.KEY_MOVIE = "movie";
rh.KEY_LAST_TOUCHED = "lastTouched";
rh.KEY_UID = "uid";

rh.ROSEFIRE_REGISTRY_TOKEN = "056cedef-84f2-4442-ad87-3ec162004924";

rh.fbMovieQuotesManager = null;
rh.fbSingleMovieQuoteManager = null;
rh.fbAuthManager = null;

rh.MovieQuote = class {
	constructor(id, quote, movie) {
		this.id = id;
		this.quote = quote;
		this.movie = movie;
	}
}

rh.FbMovieQuotesManager = class {
	constructor(uid) {
		this._ref = firebase.firestore().collection(rh.COLLECTION_MOVIEQUOTES);
		this._documentSnapshots = [];
		this._unsubscribe = null;
		this._uid = uid;
	}

	beginListening(changeListener) {
		console.log("Listening for movie quotes");
		let query = this._ref.orderBy(rh.KEY_LAST_TOUCHED, "desc").limit(30);
		if (this._uid) {
			query = query.where(rh.KEY_UID, "==", this._uid);
		}
		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;
			console.log("Update " + this._documentSnapshots.length + " movie quotes");
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

	add(quote, movie) {
		this._ref.add({
			[rh.KEY_QUOTE]: quote,
			[rh.KEY_MOVIE]: movie,
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
	// getIdAtIndex(index) {
	// 	return this._documentSnapshots[index].id;
	// }
	// getQuoteAtIndex(index) {
	// 	return this._documentSnapshots[index].get(rh.KEY_QUOTE);
	// }
	// getMovieAtIndex(index) {
	// 	return this._documentSnapshots[index].get(rh.KEY_MOVIE);
	// }
	getMovieQuoteAtIndex(index) {
		return new rh.MovieQuote(
			this._documentSnapshots[index].id,
			this._documentSnapshots[index].get(rh.KEY_QUOTE),
			this._documentSnapshots[index].get(rh.KEY_MOVIE)
		);
	}
}

rh.ListPageController = class {
	constructor() {
		rh.fbMovieQuotesManager.beginListening(this.updateView.bind(this));
		$("#menuSignOut").click((event) => {
			console.log("Sign out.");
			rh.fbAuthManager.signOut();
		});
		$("#addCoffeeMakerDialog").on("shown.bs.modal", function (e) {
			$("#inputQuote").trigger("focus");
		});
		$("#submitAddQuote").click((event) => {
			const quote = $("#inputQuote").val();
			const movie = $("#inputMovie").val();
			rh.fbMovieQuotesManager.add(quote, movie);
			$("#inputQuote").val("");
			$("#inputMovie").val("");
		});
	}

	updateView() {
		$("#coffeeMakerList").removeAttr("id").hide();
		let $newList = $("<ul></ul>").attr("id", "coffeeMakerList").addClass("list-group");

		for (let k = 0; k < rh.fbMovieQuotesManager.length; k++) {
			const $newCard = this.createQuoteCard(
				// rh.fbMovieQuotesManager.getIdAtIndex(k),
				// rh.fbMovieQuotesManager.getQuoteAtIndex(k),
				// rh.fbMovieQuotesManager.getMovieAtIndex(k)

				rh.fbMovieQuotesManager.getMovieQuoteAtIndex(k)
			);
			$newList.append($newCard);
		}
		$("#coffeeListContainer").append($newList);
	}

	// createQuoteCard(id, quote, movie) {}
	createQuoteCard(movieQuote) {
		// const $newCard = $("#quoteCardTemplate").clone()
		// 					.attr("id", movieQuote.id).removeClass("invisible");
		// $newCard.find(".quote-card-quote").text(movieQuote.quote);
		// $newCard.find(".quote-card-movie").text(movieQuote.movie);

		const $newCard = $(`
		  <li id="${movieQuote.id}" class="quote-card list-group-item">
		     <div class="quote-card-quote">${movieQuote.quote}</div>
		     <div class="quote-card-movie text-right blockquote-footer">${movieQuote.movie}</div>
	      </li>`);
		$newCard.click((event) => {
			console.log("You have clicked", movieQuote);
			// rh.storage.setMovieQuoteId(movieQuote.id);
			window.location.href = `/moviequote.html?id=${movieQuote.id}`;
		});
		return $newCard;
	}
}


// rh.storage = rh.storage || {};
// rh.storage.KEY_MOVIE_QUOTE_ID = "movieQuoteId";
// rh.storage.setMovieQuoteId = function(movieQuoteId) {
// 	sessionStorage.setItem(rh.storage.KEY_MOVIE_QUOTE_ID, movieQuoteId);
// }

// rh.storage.getMovieQuoteId = function() {
// 	const movieQuoteId = sessionStorage.getItem(rh.storage.KEY_MOVIE_QUOTE_ID);
// 	if (!movieQuoteId) {
// 		console.log("Missing the Movie Quote ID!!!!!");
// 	}
// 	return movieQuoteId;
// }

rh.FbSingleMovieQuoteManager = class {
	constructor(movieQuoteId) {
		this._ref = firebase.firestore().collection(rh.COLLECTION_MOVIEQUOTES).doc(movieQuoteId);
		this._document = {};
		this._unsubscribe = null;
	}

	beginListening(changeListener) {
		console.log("Listening for this movie quote");
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

	update(quote, movie) {
		this._ref.update({
			[rh.KEY_QUOTE]: quote,
			[rh.KEY_MOVIE]: movie,
			[rh.KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now()
		}).then((docRef) => {
			console.log("The update is complete");
		});
	}
	delete() {
		return this._ref.delete();
	}

	get quote() {
		return this._document.get(rh.KEY_QUOTE);
	}

	get movie() {
		return this._document.get(rh.KEY_MOVIE);
	}

	get uid() {
		return this._document.get(rh.KEY_UID);
	}
}

rh.DetailPageController = class {
	constructor() {
		rh.fbSingleMovieQuoteManager.beginListening(this.updateView.bind(this));
		$("#editQuoteDialog").on("show.bs.modal", function (e) {
			$("#inputQuote").val(rh.fbSingleMovieQuoteManager.quote);
			$("#inputMovie").val(rh.fbSingleMovieQuoteManager.movie);
		});
		$("#editQuoteDialog").on("shown.bs.modal", function (e) {
			$("#inputQuote").trigger("focus");
		});
		$("#submitEditQuote").click((event) => {
			const quote = $("#inputQuote").val();
			const movie = $("#inputMovie").val();
			rh.fbSingleMovieQuoteManager.update(quote, movie);
		});

		$("#deleteQuote").click((event) => {
			rh.fbSingleMovieQuoteManager.delete().then(() => {
				window.location.href = "/list.html";
			});
		});

	}

	updateView() {
		$("#cardQuote").html(rh.fbSingleMovieQuoteManager.quote);
		$("#cardMovie").html(rh.fbSingleMovieQuoteManager.movie);

		// Show edit and delete if allowed.
		if(rh.fbSingleMovieQuoteManager.uid == rh.fbAuthManager.uid) {
			$("#menuEdit").show();
			$("#menuDelete").show();
		}

	}
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

	beginAuthListening = function() {
		firebase.auth().onAuthStateChanged(function(user) {
			if (user) {
			  // User is signed in.
			  $("#uid").html(`<b>uid</b>: ${user.uid}`);
			  $("#email").html(`<b>email</b>: ${user.email}`);
			  $("#displayName").html(`<b>displayName</b>: ${user.displayName}`);
			  $("#photoURL").attr("src", user.photoURL);
			  $("#phoneNumber").html(`<b>phone</b>: ${user.phoneNumber}`);
			  console.log(user.providerData);
			  console.log("A user IS signed in. Uid = ", user.uid);
			  $("#firebaseui-auth-container").hide();
			  $("#emailPassword").hide();
			  $("#userInfo").show();
			} else {
			  // User is signed out.
			  console.log("There is no user. Nobody is signed in.");
			  $("#firebaseui-auth-container").show();
			  $("#emailPassword").hide();
			  $("#userInfo").hide();
			}
		  });
	}
	
	enableEmailPassword = function () {
		const username = new mdc.textField.MDCTextField(document.querySelector('.email'));
		const password = new mdc.textField.MDCTextField(document.querySelector('.password'));
	
		new mdc.ripple.MDCRipple(document.querySelector('#createAccount'));
		new mdc.ripple.MDCRipple(document.querySelector('#login'));
	
		$("#createAccount").click((event) => {
			const emailValue = $("#email-input").val();
			const passwordValue = $("#password-input").val();
			console.log("Create a new user", emailValue, passwordValue);
			firebase.auth().createUserWithEmailAndPassword(emailValue, passwordValue).catch(function(error) {
				// CONSIDER: In a real app tell the user what is wrong.
				console.log(`Error ${error.code}: ${error.message}`);
			  });
		});
		$("#login").click((event) => {
			console.log("TODO: Log in an existing user");
			const emailValue = $("#email-input").val();
			const passwordValue = $("#password-input").val();
			console.log("Create a new user", emailValue, passwordValue);
			firebase.auth().signInWithEmailAndPassword(emailValue, passwordValue).catch(function(error) {
				// CONSIDER: In a real app tell the user what is wrong.
				console.log(`Error ${error.code}: ${error.message}`);
			  });
		});
	};

	signOut() {
		firebase.auth().signOut();
	}
}

rh.LoginPageController = class {
	constructor() {
		$("#login").click((event) => {
			rh.fbAuthManager.signIn();
		});
	}
}

rh.checkForRedirects = function () {
	// Redirects
	if ($("#login-page").length && rh.fbAuthManager.isSignIn) {
		window.location.href = "/list.html";
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
		rh.fbMovieQuotesManager = new rh.FbMovieQuotesManager(urlUid);
		new rh.ListPageController();
	} else if ($("#detail-page").length) {
		console.log("On the detail page");
		// const movieQuoteId = rh.storage.getMovieQuoteId();
		
		const movieQuoteId = urlParams.get('id');
		if (movieQuoteId) {
			rh.fbSingleMovieQuoteManager = new rh.FbSingleMovieQuoteManager(movieQuoteId);
			new rh.DetailPageController();
		} else {
			console.log("Missing a movie quote id");
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
	rh.fbAuthManager.beginListening(() => {
		console.log("Auth state changed. isSignedIn = ", rh.fbAuthManager.isSignIn);
		rh.enableEmailPassword();
		rh.beginAuthListening();
		rh.checkForRedirects();
		rh.initializePage();
	});
});