/* =====================================================================
   09 · INICIALIZAÇÃO
   ===================================================================== */

document.querySelectorAll('img[data-asset]').forEach(i=>i.src=ASSETS[i.dataset.asset]);

function refreshStudentViews(){ renderChips(); renderCatalog(); renderPacks(); renderCarousel(); }

/* tela de carregamento: logo e barra azul */
(()=>{
  const s=$('splash'), off=()=>setTimeout(()=>{ s.classList.add('off'); setTimeout(()=>s.remove(),500); },600);
  if(document.readyState==='complete') off(); else addEventListener('load',off);
})();

renderAuth();
refreshStudentViews();
autoCar();
