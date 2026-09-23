import { C } from '../../lib/styles';

export default function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Outfit:wght@400;500;600;700&display=swap');
      *{margin:0;padding:0;box-sizing:border-box;}
      html,body,#root{height:100%;font-family:'Outfit',sans-serif;background:${C.fondo};color:${C.tinta};}
      body{font-variant-numeric:tabular-nums;}
      @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
      @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{opacity:1;transform:none}}
      @keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1}}
      @keyframes spin{to{transform:rotate(360deg)}}
      ::-webkit-scrollbar{width:6px;height:6px}
      ::-webkit-scrollbar-track{background:transparent}
      ::-webkit-scrollbar-thumb{background:#d0cece;border-radius:3px}
      button:active{transform:scale(.97)}
      button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid ${C.mentaBorde};outline-offset:2px}
      input,select,textarea{-webkit-appearance:none;}
      input[type=search]::-webkit-search-cancel-button{-webkit-appearance:none}
    `}</style>
  );
}
