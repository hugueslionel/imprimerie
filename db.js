// Ouvre ou crée la base de données IndexedDB pour les exercices
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("ExerciceDB", 1);

        // Création de la structure à la première ouverture
        request.onupgradeneeded = function (event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains("states")) {
                db.createObjectStore("states", { keyPath: "key" }); // Clé unique
            }
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

// Sauvegarde d'un état dans la base de données
async function saveState(key, value) {
    const db = await openDB();
    const tx = db.transaction("states", "readwrite");
    const store = tx.objectStore("states");
    store.put({ key, value });
    return tx.complete;
}

// Chargement d'un état depuis la base de données
async function loadState(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction("states", "readonly");
        const store = tx.objectStore("states");
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result ? request.result.value : null);
        request.onerror = (event) => reject(event.target.error);
    });
}

// Sauvegarde du progrès d'un exercice pour un élève
async function saveProgress(studentName, exercise, difficulty, progress) {
    const key = `${studentName}_${exercise}_${difficulty}_progress`;
    await saveState(key, progress);
}

// Chargement du progrès d'un exercice pour un élève
async function loadProgress(studentName, exercise, difficulty) {
    const key = `${studentName}_${exercise}_${difficulty}_progress`;
    return await loadState(key) || 0;
}

// Sauvegarde des réponses d'un exercice pour un élève
async function saveExerciseAnswers(studentName, exercise, difficulty, answers) {
    const key = `${studentName}_${exercise}_${difficulty}_answers`;
    await saveState(key, answers);
}

// Chargement des réponses d'un exercice pour un élève
async function loadExerciseAnswers(studentName, exercise, difficulty) {
    const key = `${studentName}_${exercise}_${difficulty}_answers`;
    return await loadState(key) || {};
}

// Réinitialisation des données d'un élève
async function resetStudentData(studentName) {
    const db = await openDB();
    const tx = db.transaction("states", "readwrite");
    const store = tx.objectStore("states");
    
    // Récupérer toutes les clés
    const request = store.getAllKeys();
    
    request.onsuccess = () => {
        const keys = request.result;
        keys.forEach(key => {
            if (key.startsWith(studentName + '_')) {
                store.delete(key);
            }
        });
    };
    
    return tx.complete;
}

// Fonction utilitaire pour générer une clé unique
function generateKey(studentName, exercise, difficulty, type = 'progress') {
    return `${studentName}_${exercise}_${difficulty}_${type}`;
}
