import React, { useState, useRef, useEffect } from "react";
import { db, storage } from "./firebase";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  increment,
} from "firebase/firestore";

export default function BorrowBook({ user, category, onBack }) {
  const [bookName, setBookName] = useState("");
  const [img, setImg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const videoRef = useRef(null);

  // ฟังก์ชันเปิดกล้องที่เลือกไว้
  const startCamera = async () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode, width: 400, height: 300 },
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("ไม่สามารถเข้าถึงกล้องได้: " + err.message);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode]);

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const takePhoto = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 300;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0, 400, 300);
    setImg(canvas.toDataURL("image/png"));
  };

  const save = async () => {
    if (!img) return alert("กรุณาถ่ายรูปยืนยัน");
    if (!bookName.trim()) return alert("กรุณากรอกชื่อหนังสือที่ยืม");

    setLoading(true);

    try {
      console.log("🔍 กำลังค้นหาหนังสือในหมวด:", category);

      // 1. อัปโหลดรูปภาพ
      const sRef = ref(storage, `borrows/${Date.now()}.png`);
      await uploadString(sRef, img, "data_url");
      const url = await getDownloadURL(sRef);
      console.log("✅ อัปโหลดรูปสำเร็จ:", url);

      // 2. 🔥 ค้นหาหนังสือตามหมวดหมู่และลดสต็อก
      const booksQuery = query(
        collection(db, "books"),
        where("category", "==", category)
      );
      const booksSnapshot = await getDocs(booksQuery);

      console.log(
        "📚 พบหนังสือในหมวด",
        category,
        ":",
        booksSnapshot.size,
        "รายการ"
      );

      if (!booksSnapshot.empty) {
        let stockReduced = false;

        for (const bookDoc of booksSnapshot.docs) {
          const bookData = bookDoc.data();

          console.log(
            "📖 ตรวจสอบหนังสือ:",
            bookData.name,
            "| Stock:",
            bookData.stock
          );

          if (bookData.stock > 0) {
            console.log("⬇️ กำลังลด stock ของหนังสือ:", bookData.name);

            // ลดสต็อก 1 เล่ม
            await updateDoc(bookDoc.ref, {
              stock: increment(-1),
            });

            console.log("✅ ลด stock สำเร็จ! Stock ใหม่:", bookData.stock - 1);
            stockReduced = true;
            break; // ลดได้แล้วหยุดลูป
          }
        }

        if (!stockReduced) {
          console.log("❌ หนังสือในหมวดนี้หมดสต็อกทั้งหมด");
          alert("⚠️ หนังสือในหมวดนี้หมดสต็อกแล้ว ไม่สามารถยืมได้");
          setLoading(false);
          return;
        }
      } else {
        // ไม่พบหนังสือในหมวดนี้
        console.log("⚠️ ไม่พบหนังสือในหมวด:", category);
      }

      // 3. บันทึกข้อมูลการยืมของ User
      console.log("💾 กำลังบันทึกประวัติการยืม...");
      const userSnap = await getDoc(doc(db, "users", user.uid));
      const current = userSnap.exists() ? userSnap.data().borrows || [] : [];

      await setDoc(
        doc(db, "users", user.uid),
        {
          borrows: [
            ...current,
            {
              id: Date.now().toString(),
              bookName, // ชื่อที่ User กรอก
              category,
              photoURL: url,
              date: new Date().toLocaleString("th-TH"),
              borrowDate: new Date().toLocaleString("th-TH"),
            },
          ],
        },
        { merge: true }
      );

      console.log("✅ บันทึกประวัติสำเร็จ!");
      alert("✅ ยืมสำเร็จ! สต็อกหนังสือในหมวด " + category + " ถูกลดแล้ว");
      onBack();
    } catch (e) {
      console.error("❌ Error:", e);
      alert("❌ เกิดข้อผิดพลาด: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button onClick={onBack} style={styles.backBtn}>
          ← กลับ
        </button>
        <h2 style={styles.title}>ยืมหนังสือ</h2>
        <p style={styles.category}>หมวด: {category}</p>

        <div style={styles.cameraWrapper}>
          {!img ? (
            <video ref={videoRef} autoPlay playsInline style={styles.video} />
          ) : (
            <img src={img} style={styles.video} alt="preview" />
          )}
          {!img && (
            <button onClick={toggleCamera} style={styles.switchBtn}>
              🔄 สลับเป็นกล้อง{facingMode === "user" ? "หลัง" : "หน้า"}
            </button>
          )}
        </div>
        {!img ? (
          <button onClick={takePhoto} style={styles.captureBtn}>
            📸 ถ่ายรูปยืนยัน
          </button>
        ) : (
          <button onClick={() => setImg(null)} style={styles.retryBtn}>
            🔄 ถ่ายใหม่
          </button>
        )}
        <input
          placeholder="ชื่อหนังสือที่ยืม (กรอกอะไรก็ได้)"
          value={bookName}
          onChange={(e) => setBookName(e.target.value)}
          style={styles.input}
        />
        <p
          style={{
            fontSize: 12,
            color: "#666",
            marginTop: -5,
            marginBottom: 10,
          }}
        >
          💡 ระบบจะลด stock จากหนังสือในหมวด "{category}" อัตโนมัติ
        </p>
        <button onClick={save} disabled={loading} style={styles.confirmBtn}>
          {loading ? "กำลังบันทึก..." : "✅ ยืนยันการยืม"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f0f2f5",
    padding: "20px",
  },
  card: {
    background: "#fff",
    padding: "30px",
    borderRadius: "30px",
    width: "100%",
    maxWidth: "450px",
    textAlign: "center",
    position: "relative",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
  },
  backBtn: {
    position: "absolute",
    top: "25px",
    left: "25px",
    background: "none",
    border: "none",
    color: "#666",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
  },
  title: { color: "#1a3c34", marginBottom: "10px" },
  category: { color: "#666", fontSize: "14px", marginBottom: "20px" },
  cameraWrapper: {
    width: "100%",
    height: "280px",
    background: "#000",
    borderRadius: "20px",
    overflow: "hidden",
    position: "relative",
    marginBottom: "15px",
  },
  video: { width: "100%", height: "100%", objectFit: "cover" },
  switchBtn: {
    position: "absolute",
    bottom: "10px",
    right: "10px",
    background: "rgba(0,0,0,0.6)",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    cursor: "pointer",
  },
  input: {
    width: "100%",
    padding: "15px",
    borderRadius: "15px",
    border: "2px solid #eee",
    marginBottom: "15px",
    boxSizing: "border-box",
    fontSize: "15px",
  },
  confirmBtn: {
    width: "100%",
    padding: "18px",
    background: "#1a3c34",
    color: "#fff",
    border: "none",
    borderRadius: "15px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "16px",
  },
  captureBtn: {
    width: "100%",
    padding: "12px",
    background: "#475569",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    marginBottom: "10px",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  retryBtn: {
    width: "100%",
    padding: "12px",
    background: "#ff4d4d",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    marginBottom: "10px",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
