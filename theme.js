/* Folio theme (3.0): shared by the shelf and every play. Loaded in <head> so a page never flashes the wrong colours.
   folio-theme: auto (follows the device's light/dark) | light | paper | dark | night.
   folio-nightauto "1": Night from 8pm to 7am, whatever the theme.
   Values saved before 3.0 are mapped once: timed -> auto + night toggle, papertimed -> paper + night toggle, papernight -> dark. */
(function(){
  var get=function(k){try{return localStorage.getItem(k)}catch(e){return null}},set=function(k,v){try{localStorage.setItem(k,v)}catch(e){}};
  var OLD={timed:["auto",1],papertimed:["paper",1],papernight:["dark",0]};
  function migrate(){var t=get("folio-theme");if(t&&OLD[t]){set("folio-theme",OLD[t][0]);if(OLD[t][1])set("folio-nightauto","1")}}
  migrate();
  window.FOLIO_THEMES=["paper","light","dark","night"];
  /* the chosen theme (for the picker) and the one shown now (night toggle applied) */
  window.folioThemeChosen=function(){migrate();var t=get("folio-theme")||"auto";return /^(auto|light|paper|dark|night)$/.test(t)?t:"auto"};
  window.folioNightAuto=function(){return get("folio-nightauto")==="1"};
  window.folioThemeNow=function(){var t=folioThemeChosen(),h=new Date().getHours();return folioNightAuto()&&(h>=20||h<7)?"night":t};
  window.folioTheme=function(){var d=document.documentElement,t=folioThemeNow();
    if(t==="auto")d.removeAttribute("data-theme");else d.setAttribute("data-theme",t);
    d.style.setProperty("--scale",parseFloat(get("folio-size"))||1.3)};
  /* status-bar colour follows the page colour (the two media metas cover Auto) */
  window.folioBar=function(){try{var d=document.documentElement,t=d.getAttribute("data-theme"),pg=t?getComputedStyle(d).getPropertyValue("--page").trim():"";
    document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){if(!m.dataset.c)m.dataset.c=m.content;m.content=pg||m.dataset.c})}catch(e){}};
  folioTheme();
})();
