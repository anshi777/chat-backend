
import "dotenv/config";
import { db } from "./config/firebase";

async function testFirebase() {
  try {
    // Reference to a temporary Firestore document
    const testRef = db.collection("setup_checks").doc("connection_test");

    // Write data
    await testRef.set({
      message: "Firebase connection successful!",
      createdAt: new Date(),
    });

    console.log("Document written successfully!");

    // Read data
    const document = await testRef.get();

    console.log("Document data:", document.data());

    // Delete temporary document
    await testRef.delete();

    console.log("Test document deleted successfully!");
  } catch (error) {
    console.error("Firebase connection failed:", error);
    process.exitCode = 1;
  }
}

testFirebase();
