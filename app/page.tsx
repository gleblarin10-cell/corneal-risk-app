"use client"

export default function Page() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "linear-gradient(135deg,#0f172a,#1e3a8a,#7c3aed)",
      color: "white",
      fontFamily: "sans-serif"
    }}>
      
      <div style={{
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(20px)",
        padding: "40px",
        borderRadius: "20px",
        textAlign: "center",
        maxWidth: "700px"
      }}>

        <h1 style={{fontSize:"40px",marginBottom:"20px"}}>
          Corneal Risk Platform
        </h1>

        <p style={{opacity:0.8,fontSize:"18px"}}>
          Clinical decision support system for prediction of corneal graft rejection risk
        </p>

        <div style={{marginTop:"30px"}}>

          <button style={{
            padding:"12px 24px",
            borderRadius:"12px",
            border:"none",
            background:"#22c55e",
            color:"white",
            fontSize:"16px"
          }}>
            Open Patient Dashboard
          </button>

        </div>

      </div>

    </main>
  )
}
