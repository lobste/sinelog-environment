// js/storage.js
import { collection, onSnapshot, setDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, db } from './firebase.js'; // Merkezi auth ve db nesnelerini import et
import { showSection } from './sections.js';

export let watchedMovies = [];
export let watchLaterMovies = [];
let watchedUnsubscribe = null;
let watchLaterUnsubscribe = null;

function unsubscribeListeners() {
    if (watchedUnsubscribe) watchedUnsubscribe();
    if (watchLaterUnsubscribe) watchLaterUnsubscribe();
}

export function loadMoviesFromFirestore(userId) {
    unsubscribeListeners();

    const watchedRef = collection(db, "users", userId, "watchedMovies");
    watchedUnsubscribe = onSnapshot(watchedRef, (snapshot) => {
        watchedMovies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Watched movies updated from Firestore:", watchedMovies.length);
        if (!document.getElementById('my-watched-movies-section').classList.contains('hidden')) {
            showSection('my-watched-movies-section');
        }
    });

    const watchLaterRef = collection(db, "users", userId, "watchLaterMovies");
    watchLaterUnsubscribe = onSnapshot(watchLaterRef, (snapshot) => {
        watchLaterMovies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Watch later movies updated from Firestore:", watchLaterMovies.length);
        if (!document.getElementById('watch-later-movies-section').classList.contains('hidden')) {
            showSection('watch-later-movies-section');
        }
    });
}

export function clearMovieLists() {
    unsubscribeListeners();
    watchedMovies = [];
    watchLaterMovies = [];
    console.log("Local movie lists cleared.");
}

export async function saveMovie(movieData) {
    const userId = auth.currentUser?.uid;
    if (!userId) return console.error("User not authenticated to save movie.");
    
    const { id, type, ...dataToSave } = movieData;
    const collectionName = type === 'watched' ? 'watchedMovies' : 'watchLaterMovies';
    
    if (!id) return console.error("Movie ID is missing. Cannot save movie.");

    const docRef = doc(db, "users", userId, collectionName, id);
    
    try {
        await setDoc(docRef, dataToSave, { merge: true });
        console.log(`Movie ${id} saved to ${collectionName}`);
    } catch (error) {
        console.error("Error saving movie: ", error);
    }
}

/**
 * Belirtilen listeden bir filmi siler. (Yeni Fonksiyon)
 * @param {string} movieId Silinecek filmin ID'si.
 * @param {string} listType Filmin bulunduğu listenin türü ('watched' veya 'watch-later').
 */
export async function deleteMovieFromList(movieId, listType) {
    const userId = auth.currentUser?.uid;
    if (!userId) return console.error("User not authenticated to delete movie.");
    if (!movieId || !listType) return console.error("Movie ID or list type is missing.");

    const collectionName = listType === 'watched' ? 'watchedMovies' : 'watchLaterMovies';
    const docRef = doc(db, "users", userId, collectionName, movieId);

    try {
        await deleteDoc(docRef);
        console.log(`Movie ${movieId} deleted from ${collectionName}`);
    } catch (error) {
        console.error("Error deleting movie: ", error);
    }
}
