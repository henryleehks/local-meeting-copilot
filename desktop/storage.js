import { seedMeetings, seedSettings } from "./seed-data.js";

const DB_NAME = "live-meeting-copilot";
const DB_VERSION = 1;

const STORES = {
  meetings: "meetings",
  participants: "participants",
  transcriptEvents: "transcriptEvents",
  answerSuggestions: "answerSuggestions",
  meetingMinutes: "meetingMinutes",
  settings: "settings"
};

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error("IndexedDB transaction aborted."));
  });
}

function getAllFromIndex(db, storeName, indexName, value) {
  const transaction = db.transaction(storeName, "readonly");
  const store = transaction.objectStore(storeName);
  return requestToPromise(store.index(indexName).getAll(value));
}

function createStore(db, name, options = { keyPath: "id" }) {
  if (!db.objectStoreNames.contains(name)) {
    return db.createObjectStore(name, options);
  }
  return null;
}

function ensureIndexes(store, indexes) {
  if (!store) return;
  indexes.forEach(([name, keyPath]) => {
    if (!store.indexNames.contains(name)) store.createIndex(name, keyPath);
  });
}

export class LocalMeetingStore {
  constructor() {
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;

    this.db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        ensureIndexes(createStore(db, STORES.meetings), [["meetingType", "meetingType"], ["startTime", "startTime"]]);
        ensureIndexes(createStore(db, STORES.participants), [["meetingId", "meetingId"], ["calendarSource", "calendarSource"]]);
        ensureIndexes(createStore(db, STORES.transcriptEvents), [["meetingId", "meetingId"], ["timestamp", "timestamp"], ["source", "source"]]);
        ensureIndexes(createStore(db, STORES.answerSuggestions), [["meetingId", "meetingId"], ["createdAt", "createdAt"]]);
        ensureIndexes(createStore(db, STORES.meetingMinutes), [["meetingId", "meetingId"], ["createdAt", "createdAt"]]);
        createStore(db, STORES.settings);
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    await this.seedDemoDataIfEmpty();
    return this.db;
  }

  async seedDemoDataIfEmpty() {
    const count = await this.count(STORES.meetings);
    if (count > 0) return false;

    const transaction = this.db.transaction(Object.values(STORES), "readwrite");
    const stores = Object.fromEntries(Object.values(STORES).map((name) => [name, transaction.objectStore(name)]));

    seedMeetings.forEach((seedMeeting) => {
      const { participants, transcriptEvents, answerSuggestion, minutes, ...meeting } = seedMeeting;
      stores.meetings.put(meeting);
      participants.forEach((participant) => stores.participants.put({ ...participant, meetingId: meeting.id }));
      transcriptEvents.forEach((event) => stores.transcriptEvents.put(event));
      stores.answerSuggestions.put({
        ...answerSuggestion,
        contextWindowIds: transcriptEvents.map((event) => event.id)
      });
      stores.meetingMinutes.put(minutes);
    });
    stores.settings.put(seedSettings);

    await transactionDone(transaction);
    return true;
  }

  async count(storeName) {
    const transaction = this.db.transaction(storeName, "readonly");
    return requestToPromise(transaction.objectStore(storeName).count());
  }

  async getMeetingBundleByType(meetingType) {
    const transaction = this.db.transaction(STORES.meetings, "readonly");
    const meeting = await requestToPromise(transaction.objectStore(STORES.meetings).index("meetingType").get(meetingType));
    if (!meeting) return null;
    return this.getMeetingBundle(meeting.id);
  }

  async getMeetingBundle(meetingId) {
    const [meeting, participants, transcriptEvents, answerSuggestions, minutesDrafts] = await Promise.all([
      requestToPromise(this.db.transaction(STORES.meetings, "readonly").objectStore(STORES.meetings).get(meetingId)),
      getAllFromIndex(this.db, STORES.participants, "meetingId", meetingId),
      getAllFromIndex(this.db, STORES.transcriptEvents, "meetingId", meetingId),
      getAllFromIndex(this.db, STORES.answerSuggestions, "meetingId", meetingId),
      getAllFromIndex(this.db, STORES.meetingMinutes, "meetingId", meetingId)
    ]);

    if (!meeting) return null;

    return {
      ...meeting,
      participants: participants.sort((a, b) => a.displayName.localeCompare(b.displayName)),
      transcriptEvents: transcriptEvents.sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
      answerSuggestion: answerSuggestions.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] || null,
      minutes: minutesDrafts.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] || null
    };
  }

  async getSetting(id) {
    const transaction = this.db.transaction(STORES.settings, "readonly");
    return requestToPromise(transaction.objectStore(STORES.settings).get(id));
  }

  async putTranscriptEvent(event) {
    const transaction = this.db.transaction(STORES.transcriptEvents, "readwrite");
    transaction.objectStore(STORES.transcriptEvents).put(event);
    await transactionDone(transaction);
    return event;
  }
}

export const localMeetingStore = new LocalMeetingStore();
