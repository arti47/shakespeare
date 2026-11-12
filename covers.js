/* Folio covers: one shared cover system for every play on the shelf.
   COVER[id] = {c: leather colour (dark, so gilt text keeps high contrast), q: short epigraph from the play (edition spelling), e: emblem}.
   Emblems are SVG markup in a 100×100 box, drawn in gilt (currentColor); class "f" = filled, class "k" = cut back to the leather.
   coverHTML(p, stat) renders a shelf cover; emblemSVG(id) renders one emblem (also used on genre spines).
   Adding a play: add its COVER entry (tools/build.js fails without one). */
(function(){
const R=(n,d=1)=>+n.toFixed(d);
/* small builders */
const star=(cx,cy,r,f=1)=>{let d="";for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?r*.42:r;d+=(i?"L":"M")+R(cx+q*Math.cos(a))+" "+R(cy+q*Math.sin(a))}return `<path${f?' class="f"':""} d="${d}Z"/>`};
const spark=(x,y,s)=>`<path class="f" d="M${x} ${y-s}L${R(x+s*.22)} ${R(y-s*.22)}L${x+s} ${y}L${R(x+s*.22)} ${R(y+s*.22)}L${x} ${y+s}L${R(x-s*.22)} ${R(y+s*.22)}L${x-s} ${y}L${R(x-s*.22)} ${R(y-s*.22)}Z"/>`;
const drop=(x,y,s=4)=>`<path class="f" d="M${x} ${y-s*1.4}Q${x+s} ${y} ${x} ${y+s*.8}Q${x-s} ${y} ${x} ${y-s*1.4}Z"/>`;
const rays=(cx,cy,r0,r1,n,a0=0)=>{let d="";for(let i=0;i<n;i++){const a=a0+i*2*Math.PI/n;d+=`M${R(cx+r0*Math.cos(a))} ${R(cy+r0*Math.sin(a))}L${R(cx+r1*Math.cos(a))} ${R(cy+r1*Math.sin(a))}`}return `<path d="${d}"/>`};
/* leaves along an arc: centre, radius, start/end angle (deg), count, side (1 outer) */
const leaves=(cx,cy,r,a0,a1,n,len=9,w=3.4)=>{let s="";for(let i=0;i<n;i++){const a=(a0+(a1-a0)*i/(n-1))*Math.PI/180,x=cx+r*Math.cos(a),y=cy+r*Math.sin(a),t=a*180/Math.PI+(a1>a0?90:-90)+(i%2?32:-32);s+=`<ellipse class="f" cx="${R(x)}" cy="${R(y)}" rx="${len/2}" ry="${w/2}" transform="rotate(${R(t)} ${R(x)} ${R(y)})"/>`}return s};
const crown=(x,y,w,h)=>{const u=w/6;return `<path d="M${x} ${y+h}L${R(x-u*.2)} ${y+h*.25}L${R(x+u*1.6)} ${R(y+h*.55)}L${x+w/2} ${y}L${R(x+w-u*1.6)} ${R(y+h*.55)}L${R(x+w+u*.2)} ${y+h*.25}L${x+w} ${y+h}Z"/><path d="M${x} ${R(y+h*.8)}H${x+w}"/><circle class="f" cx="${R(x-u*.2)}" cy="${R(y+h*.25-2)}" r="2.2"/><circle class="f" cx="${x+w/2}" cy="${y-2.4}" r="2.4"/><circle class="f" cx="${R(x+w+u*.2)}" cy="${R(y+h*.25-2)}" r="2.2"/>`};
const rose=(cx,cy,r,fill)=>`<circle${fill?' class="f"':""} cx="${cx}" cy="${cy}" r="${r}"/><path${fill?' class="k"':""} d="M${cx} ${R(cy-r*.55)}A${R(r*.55)} ${R(r*.55)} 0 1 1 ${R(cx-r*.5)} ${cy}A${R(r*.3)} ${R(r*.3)} 0 1 1 ${R(cx+r*.2)} ${cy}"/>`;
const mirror=s=>`<g transform="matrix(-1 0 0 1 100 0)">${s}</g>`;
const strawb=(x,y)=>`<g transform="translate(${x} ${y})"><path class="f" d="M-4.5 -1Q-5.5 6 0 9Q5.5 6 4.5 -1Q0 -3 -4.5 -1Z"/><path d="M-4 -2.5L0 -5.5L4 -2.5" stroke-width="1.6"/></g>`;
const env=(t)=>`<g transform="${t}"><rect x="0" y="0" width="54" height="36" rx="2"/><path d="M0 0L27 20L54 0"/></g>`;
const sun=(cx,cy,r)=>`<circle class="f" cx="${cx}" cy="${cy}" r="${r}"/>`+rays(cx,cy,r+2.5,r+7,12,Math.PI/12);

window.coverColor=id=>(window.COVER[id]||{}).c||"#1d1b22";
window.COVER={
"othello":{c:"#3b1220",q:"I kiss'd thee ere I kill'd thee",
 e:`<path d="M18 30Q34 22 50 28T82 24Q76 46 84 64Q66 72 50 66T18 76Q24 54 18 30Z"/><path d="M24 35Q36 29 50 33T76 30Q71 47 77 60Q63 66 50 61T25 70Q29 52 24 35Z" stroke-width="1" stroke-dasharray="1.5 2.5"/>${strawb(38,42)}${strawb(60,40)}${strawb(48,54)}${strawb(66,55)}${strawb(34,60)}<path d="M84 64L90 74M18 76L12 84" stroke-width="1.6"/>`},
"antony-and-cleopatra":{c:"#0e3b3a",q:"Age cannot wither her",
 e:`<circle cx="50" cy="40" r="26" stroke-width="1" stroke-dasharray="2 3"/><ellipse cx="50" cy="82" rx="26" ry="7"/><ellipse cx="50" cy="75" rx="19" ry="5.5"/><path d="M66 73C82 62 74 46 54 48C34 50 30 36 44 28C52 22 58 25 61 21" stroke-width="4"/><path class="f" d="M58 22C57 14 68 11 74 15C77 18 71 23 61 24Z"/><path d="M75 16L82 13M75 16L82 19" stroke-width="1.4"/>`},
"king-lear":{c:"#262c38",q:"Nothing will come of nothing",
 e:`<path d="M24 34Q14 34 15 25Q16 17 25 18Q28 8 40 10Q47 3 57 9Q67 5 73 14Q84 14 84 24Q86 34 76 34Z"/><path d="M30 40L27 50M42 40L39 52M70 40L67 50" stroke-width="1.6"/><path class="f" d="M56 34L47 52H55L49 66L64 46H56L62 34Z"/>${crown(28,64,44,24)}`},
"tempest":{c:"#0b3a3c",q:"We are such stuff as dreams are made on",
 e:`<path d="M20 60H80L71 72H29Z"/><path d="M50 60V14M36 60V26"/><path d="M50 18Q66 26 64 42L50 44ZM50 46Q64 48 62 58H50M36 30Q46 36 45 48L36 50Z"/><path d="M50 14L58 17L50 20" class="f"/><path d="M8 78Q18 70 28 78T48 78T68 78T92 78M12 88Q22 80 32 88T52 88T72 88T92 86"/><path class="f" d="M22 6L13 24H20L14 38L29 18H22L28 6Z"/>`},
"twelfth-night":{c:"#36234d",q:"If music be the food of love, play on",
 e:`<path d="M36 90C14 82 16 52 36 46C47 42 58 44 64 52C74 68 62 92 36 90Z"/><circle cx="41" cy="69" r="7"/><circle cx="41" cy="69" r="3.6" stroke-width="1"/><path d="M57 47L78 18M63 52L83 23"/><path class="f" d="M77 17L85 9L91 15L83 24Z"/><path d="M30 80L40 86" stroke-width="3"/><path d="M34 82L79 20M37 84L81 22" stroke-width=".9"/><path class="f" d="M14 22a4 3 -20 1 0 8 0V6L30 9" /><path d="M22 22V6L30 9" stroke-width="1.6"/>`},
"much-ado":{c:"#1d3d2c",q:"There is a kind of merry war",
 e:`<path d="M12 44Q30 30 50 40Q70 30 88 44Q88 62 70 64Q58 64 50 56Q42 64 30 64Q12 62 12 44Z"/><path class="f" d="M23 47Q30 41 39 47Q30 53 23 47ZM61 47Q70 41 77 47Q70 53 61 47Z"/><path d="M80 60L92 94" stroke-width="3.4"/><path d="M12 44Q4 52 8 64M13 47Q4 44 5 34" stroke-width="1.6"/><path d="M50 40Q44 22 56 8Q60 26 50 40Z"/><path d="M53 14L52 34" stroke-width=".9"/>${spark(30,22,4)}${spark(74,24,3)}`},
"midsummer":{c:"#1b2152",q:"The course of true love never did run smooth",
 e:`<path class="f" d="M60 10A40 40 0 1 0 60 90A46 46 0 0 1 60 10Z"/>${spark(70,26,6)}${spark(82,52,4)}${spark(66,74,5)}${spark(86,82,3)}<g transform="translate(64 46)"><circle class="f" cx="-4" cy="-4" r="3.6"/><circle class="f" cx="4" cy="-4" r="3.6"/><circle class="f" cx="-4.5" cy="3.5" r="3.6"/><circle class="f" cx="4.5" cy="3.5" r="3.6"/><circle class="k" cx="0" cy="0" r="1.6"/></g>`},
"richard-ii":{c:"#3a1842",q:"Let us sit upon the ground",
 e:`<circle cx="50" cy="42" r="25"/><circle cx="50" cy="42" r="19.5" stroke-width="1.4"/><path d="M50 42L39 27M50 42L65 33M50 42L43 59M50 42L61 55M50 42L33 45M50 42L54 24" stroke-width="1.2"/><path d="M46 67V88Q50 93 54 88V67"/><path class="f" d="M44 67H56L54 62H46Z"/>${crown(37,4,26,12)}`},
"hamlet":{c:"#16181d",q:"To be, or not to be",
 e:`<path d="M27 58C18 30 38 13 52 13C73 13 84 31 76 56C74 62 70 62 70 68V82H34V68C34 62 29 62 27 58Z"/><path class="f" d="M33 47C33 38 46 38 46 47C46 54 33 56 33 47ZM55 47C55 38 68 38 68 47C68 56 55 54 55 47Z"/><path class="f" d="M51 55L46.5 64H55.5Z"/><path d="M38 73H66M40 73V82M46 73V83M52 73V83M58 73V83M64 73V82" stroke-width="1.6"/><path d="M60 18Q66 22 68 30" stroke-width="1.2"/>`},
"macbeth":{c:"#4a0e10",q:"Is this a dagger which I see before me",
 e:`<path d="M50 6L57 20V58H43V20Z"/><path d="M50 14V56" stroke-width="1.1"/><rect x="28" y="58" width="44" height="7" rx="3.5"/><path d="M45 65H55V84H45Z"/><path d="M45 70H55M45 75H55M45 80H55" stroke-width="1"/><circle class="f" cx="50" cy="89" r="5"/>${drop(66,32)}${drop(70,46,3.4)}${drop(34,40,3)}${star(24,14,4.5)}${star(76,12,4.5)}${star(84,26,3.5)}`},
"julius-caesar":{c:"#371c48",q:"Beware the ides of March",
 e:`${leaves(50,52,32,100,250,9)}${mirror(leaves(50,52,32,100,250,9))}<path d="M43 86Q50 80 57 86M47 84L44 94M53 84L56 94" stroke-width="1.6"/><path d="M50 18L55 30V60H45V30Z"/><rect x="36" y="60" width="28" height="5" rx="2.5"/><path d="M46.5 65H53.5V76H46.5Z"/><circle class="f" cx="50" cy="80" r="3.4"/>`},
"as-you-like-it":{c:"#28401c",q:"All the world's a stage",
 e:`<path d="M30 54Q16 50 21 36Q18 20 36 20Q42 8 57 13Q73 8 77 24Q90 30 82 44Q78 56 64 54Q52 62 38 56Z"/><path d="M45 90L47 62Q40 56 33 54M47 62L49 50M54 90L54 62Q61 57 68 54"/><path d="M14 90H86" stroke-width="1.6"/><rect class="f" x="56" y="66" width="10" height="13" rx="1" transform="rotate(8 61 72)"/><path class="k" d="M58 70H64M58 73H64M58 76H62" stroke-width=".9" transform="rotate(8 61 72)"/><path class="f" d="M50 72C48 70 46 71 47 73L50 76L53 73C54 71 52 70 50 72Z"/>`},
"romeo-and-juliet":{c:"#5a1631",q:"A pair of star-cross'd lovers",
 e:`<path d="M16 92Q34 52 70 26M84 92Q66 52 30 26" stroke-width="2" stroke-dasharray="1 4"/>${star(28,24,11)}${star(72,24,11)}<path class="f" d="M50 60C45 52 36 55 38 62C40 68 50 74 50 74C50 74 60 68 62 62C64 55 55 52 50 60Z"/>`},
"two-gentlemen":{c:"#47291a",q:"Who is Silvia? what is she",
 e:`${env("rotate(-12 50 50) translate(14 24)")}<g transform="translate(30 46)"><rect class="k" x="0" y="0" width="54" height="36" rx="2" stroke="none"/></g>${env("translate(30 46)")}<circle class="f" cx="57" cy="66" r="6"/><path class="k" d="M57 63.5C55.6 62 53.8 63 54.4 64.6L57 67.4L59.6 64.6C60.2 63 58.4 62 57 63.5Z" stroke="none"/>`},
"alls-well":{c:"#33203e",q:"All's well that ends well",
 e:`<ellipse cx="50" cy="64" rx="27" ry="23"/><ellipse cx="50" cy="64" rx="20.5" ry="16.5" stroke-width="1.4"/><path d="M40 42L44 36M60 42L56 36"/><path class="f" d="M41 34L50 22L59 34L50 41Z"/><path class="k" d="M44 34H56M50 22V41" stroke-width=".8"/>${spark(26,26,5)}${spark(76,22,4)}${spark(82,40,3)}`},
"merchant-of-venice":{c:"#3a2812",q:"The quality of mercy is not strain'd",
 e:`<circle class="f" cx="50" cy="14" r="3.4"/><path d="M50 17V86M34 86H66M18 26H82"/><path d="M18 26L9 54M18 26L27 54M82 26L73 54M82 26L91 54" stroke-width="1.2"/><path d="M7 54Q18 66 29 54ZM71 54Q82 66 93 54Z"/><path class="f" d="M18 52C15.5 48.5 11 50 12 53.2C13 56 18 59 18 59C18 59 23 56 24 53.2C25 50 20.5 48.5 18 52Z"/><circle class="f" cx="78" cy="51" r="2.4"/><circle class="f" cx="84" cy="51.5" r="2.4"/><circle class="f" cx="81" cy="48" r="2.4"/>`},
"loves-labours-lost":{c:"#1f3d3d",q:"A great feast of languages",
 e:`<path d="M50 34Q34 26 12 30V80Q34 76 50 84Q66 76 88 80V30Q66 26 50 34Z"/><path d="M50 34V84"/><path d="M19 42Q32 39 43 44M19 50Q32 47 43 52M19 58Q32 55 43 60M57 44Q68 39 81 42M57 52Q68 47 81 50" stroke-width="1"/><path class="f" d="M69 63C66.5 59.5 62 61 63 64.2C64 67 69 70 69 70C69 70 74 67 75 64.2C76 61 71.5 59.5 69 63Z"/><path d="M58 30L88 4" stroke-width="1.4"/><path class="f" d="M88 4Q78 20 64 26Q70 12 88 4Z"/>`},
"taming-of-the-shrew":{c:"#4a1a24",q:"Kiss me, Kate",
 e:`${sun(50,50,20)}<path class="k" d="M50 30A20 20 0 0 1 50 70A14 20 0 0 0 50 30Z" stroke="none"/><path class="k" d="M38 44A2.2 2.2 0 1 0 38.1 44ZM40 56Q44 60 47 56" stroke-width="1.6"/>`},
"comedy-of-errors":{c:"#25304d",q:"I to the world am like a drop of water",
 e:(()=>{let s="";for(let i=0;i<14;i++){const a=i*2*Math.PI/14,x=50+30*Math.cos(a),y=50+30*Math.sin(a),t=a*180/Math.PI+90;s+=i%2?`<ellipse cx="${R(x)}" cy="${R(y)}" rx="7.5" ry="1.8" transform="rotate(${R(t)} ${R(x)} ${R(y)})"/>`:`<ellipse cx="${R(x)}" cy="${R(y)}" rx="7.5" ry="4.6" transform="rotate(${R(t)} ${R(x)} ${R(y)})"/>`}
 return s+`<circle cx="40" cy="50" r="10"/><circle cx="60" cy="50" r="10"/><circle class="f" cx="40" cy="50" r="3"/><circle class="f" cx="60" cy="50" r="3"/>`})()},
"measure-for-measure":{c:"#24252a",q:"Some rise by sin, and some by virtue fall",
 e:`<path d="M24 12H76M24 88H76"/><path d="M28 12V88M72 12V88" stroke-width="3.4"/><path d="M35 16Q35 42 50 50Q65 42 65 16M35 84Q35 58 50 50Q65 58 65 84"/><path class="f" d="M40 30Q50 37 60 30Q58 41 50 46Q42 41 40 30Z"/><path class="f" d="M38 84Q50 66 62 84Z"/><path d="M50 50V78" stroke-width="1" stroke-dasharray="1.5 2"/>`},
"merry-wives":{c:"#3a2f14",q:"The world's mine oyster",
 e:(()=>{const a=`<path d="M44 56Q30 48 26 28Q24 18 28 8M27 34Q16 30 12 18M29 44Q16 44 8 34M26 20Q32 14 36 6"/>`;return a+mirror(a)+`<path d="M41 54Q50 50 59 54L56 78Q50 88 44 78Z"/><circle class="f" cx="46" cy="64" r="1.8"/><circle class="f" cx="54" cy="64" r="1.8"/><path d="M36 54L42 60M64 54L58 60" stroke-width="2"/>`})()},
"winters-tale":{c:"#1d2e4e",q:"Exit, pursued by a bear",
 e:`<path class="f" d="M12 72C10 58 18 46 32 44C42 36 58 36 66 42C69 37 74 36 77 39L79 43C84 45 89 48 88 52C87 55 84 55 81 56C79 60 77 62 75 66L75 82H66L66 70C60 72 52 72 46 70L44 82H35L35 69C30 70 26 69 23 67L21 82H12Z"/><circle class="k" cx="80" cy="47" r="1.4" stroke="none"/>${rays(26,18,0,7,6)}${rays(50,12,0,5,6,.3)}${rays(74,20,0,4.4,6)}`},
"titus-andronicus":{c:"#3d1a10",q:"Vengeance is in my heart",
 e:`<path d="M50 26V94"/><path class="f" d="M50 28Q40 12 24 16Q36 18 42 26Q38 20 30 22Q42 24 50 30Q58 24 70 22Q62 20 58 26Q64 18 76 16Q60 12 50 28Z"/><circle class="f" cx="50" cy="19" r="3.4"/><path d="M34 32H66"/><rect x="34" y="36" width="32" height="20" rx="1.5"/><text x="50" y="50.5" text-anchor="middle" font-family="Georgia,serif" font-size="10" fill="currentColor" stroke="none" letter-spacing=".5">SPQR</text><path d="M38 56V62M50 56V63M62 56V62" stroke-width="1.4"/><circle cx="50" cy="74" r="8"/>${leaves(50,74,8,200,340,5,5,2)}`},
"troilus-and-cressida":{c:"#1c2a46",q:"One touch of nature makes the whole world kin",
 e:`<path d="M28 84C22 66 22 44 34 34C46 24 66 24 74 36C80 46 80 60 76 84H64L62 66L52 60V48H42L40 64L34 84Z"/><path d="M52 48H72" stroke-width="2.4"/><path d="M28 34Q34 8 62 8Q84 8 86 30" stroke-width="3"/><path d="M34 26Q38 14 50 12M42 22Q46 14 56 12M58 12Q70 12 76 22M66 14Q76 16 80 26" stroke-width="1.2"/>`},
"timon-of-athens":{c:"#2b2914",q:"I am Misanthropos, and hate mankind",
 e:`<path d="M66 10L46 56M60 10H74"/><path class="f" d="M41 52L52 59L44 78Q36 82 31 75Z"/><ellipse cx="68" cy="82" rx="14" ry="4.5"/><ellipse cx="68" cy="75" rx="14" ry="4.5"/><ellipse cx="68" cy="68" rx="14" ry="4.5"/><path d="M54 68V82M82 68V82"/><circle cx="22" cy="84" r="7"/><circle cx="22" cy="84" r="3" stroke-width="1"/><circle class="f" cx="86" cy="54" r="5"/>`},
"coriolanus":{c:"#4a2410",q:"There is a world elsewhere",
 e:`<circle cx="44" cy="56" r="29"/><circle cx="44" cy="56" r="21" stroke-width="1.4"/><circle class="f" cx="44" cy="56" r="6"/>${leaves(44,56,25,200,340,7,6,2.4)}<path d="M14 92L82 16" stroke-width="3.2"/><path class="f" d="M80 18L92 4L88 22Z"/>`},
"cymbeline":{c:"#1d3326",q:"Fear no more the heat o' th' sun",
 e:`<path d="M16 46H84V84H16Z"/><path d="M16 46Q50 22 84 46"/><path d="M32 33V84M68 33V84" stroke-width="3"/><rect class="f" x="45" y="48" width="10" height="12" rx="1.5"/><circle class="k" cx="50" cy="53" r="1.6" stroke="none"/><ellipse cx="50" cy="20" rx="13" ry="5" stroke-width="2"/>${spark(68,14,3)}`},
"king-john":{c:"#2e381c",q:"To gild refined gold, to paint the lily",
 e:`<path d="M30 90V38H70V90Z"/><path d="M28 38V28H36V33H44V28H56V33H64V28H72V38"/><path d="M44 90V76Q50 68 56 76V90"/><path d="M40 50V58M60 50V58" stroke-width="3"/><path d="M50 28V6"/><path class="f" d="M50 7L66 11L50 16Z"/><path d="M14 90H86" stroke-width="1.6"/>`},
"henry-iv-part-1":{c:"#4a1718",q:"The better part of valour is discretion",
 e:`<path d="M30 32L34 88H66L70 32Z"/><path d="M70 42Q88 44 86 60Q84 74 68 74"/><path class="f" d="M28 34Q25 23 36 23Q38 14 48 18Q55 11 61 18Q72 16 71 26Q76 33 68 35Z"/><path d="M33 46H69M34 78H66" stroke-width="1.6"/>${drop(38,44,3)}`},
"henry-v":{c:"#14254a",q:"Once more unto the breach, dear friends",
 e:`<path class="f" d="M50 8C39 22 39 40 46 54H54C61 40 61 22 50 8Z"/><path class="f" d="M45 56C30 57 15 48 17 33C19 24 30 24 33 33C26 33 26 42 32 44C38 46 43 50 45 56Z"/>${mirror('<path class="f" d="M45 56C30 57 15 48 17 33C19 24 30 24 33 33C26 33 26 42 32 44C38 46 43 50 45 56Z"/>')}<rect class="f" x="33" y="54" width="34" height="8" rx="2"/><path d="M45 62C43 73 36 78 28 78M55 62C57 73 64 78 72 78M50 62V88" stroke-width="3.4"/>`},
"henry-iv-part-2":{c:"#2a1f45",q:"Uneasy lies the head that wears a crown",
 e:`<path d="M14 74Q50 60 86 74Q88 84 80 86Q50 80 20 86Q12 84 14 74Z"/><path d="M16 76L8 90M84 76L92 90" stroke-width="1.4"/><circle class="f" cx="8" cy="90" r="2.4"/><circle class="f" cx="92" cy="90" r="2.4"/>${crown(29,36,42,30)}`},
"henry-vi-part-1":{c:"#1f3a2a",q:"Pluck a white rose with me",
 e:`<path d="M50 92Q46 66 50 50Q54 36 36 24M50 50Q60 34 66 30"/><path d="M47 70L42 68M52 60L57 58M49 80L54 78M44 38L40 34" stroke-width="1.6"/><path class="f" d="M50 64Q36 62 32 70Q44 74 50 64ZM51 44Q64 38 68 44Q58 52 51 44Z"/>${rose(32,22,12,1)}${rose(70,26,12,0)}`},
"henry-vi-part-3":{c:"#1f2e45",q:"Three glorious suns, each one a perfect sun",
 e:`${sun(50,26,11)}${sun(28,64,11)}${sun(72,64,11)}<path d="M50 50L50 46M42 54L38 52M58 54L62 52" stroke-width="1.4"/>`},
"henry-viii":{c:"#4a1020",q:"Farewell, a long farewell, to all my greatness",
 e:`<ellipse cx="50" cy="38" rx="40" ry="7"/><path class="f" d="M32 36Q33 22 50 22Q67 22 68 36Q50 40 32 36Z"/><path d="M14 41L22 62M22 62L16 72M22 62L28 72M16 72L10 82M16 72L22 82M28 72L22 82M28 72L34 82" stroke-width="1.2"/>${mirror('<path d="M14 41L22 62M22 62L16 72M22 62L28 72M16 72L10 82M16 72L22 82M28 72L22 82M28 72L34 82" stroke-width="1.2"/>'+'<rect class="f" x="20.4" y="62" width="3.2" height="5" rx="1"/><rect class="f" x="14.4" y="72" width="3.2" height="5" rx="1"/><rect class="f" x="26.4" y="72" width="3.2" height="5" rx="1"/><rect class="f" x="8.4" y="82" width="3.2" height="5" rx="1"/><rect class="f" x="20.4" y="82" width="3.2" height="5" rx="1"/><rect class="f" x="32.4" y="82" width="3.2" height="5" rx="1"/>')}<rect class="f" x="20.4" y="62" width="3.2" height="5" rx="1"/><rect class="f" x="14.4" y="72" width="3.2" height="5" rx="1"/><rect class="f" x="26.4" y="72" width="3.2" height="5" rx="1"/><rect class="f" x="8.4" y="82" width="3.2" height="5" rx="1"/><rect class="f" x="20.4" y="82" width="3.2" height="5" rx="1"/><rect class="f" x="32.4" y="82" width="3.2" height="5" rx="1"/>`},
"richard-iii":{c:"#1a1a22",q:"Now is the winter of our discontent",
 e:`<path class="f" d="M10 70C8 56 20 44 38 42C50 36 64 38 72 46L84 53C89 55 90 59 86 61L80 62C78 66 74 68 72 68V82H63V72C56 74 46 74 40 72L38 82H29V70C24 70 20 70 18 68L16 80H8Z"/><path class="f" d="M66 44L70 34L74 46Z"/><path class="k" d="M80 60Q85 56 82 52" stroke-width="1.8"/><circle class="k" cx="74" cy="51" r="1.5" stroke="none"/><path d="M36 42L37 35M44 39L46 32M52 38L54 31M60 39L62 33" stroke-width="1.6"/>${crown(36,8,28,14)}`},
"henry-vi-part-2":{c:"#47280f",q:"Let's kill all the lawyers",
 e:`<path d="M43 52L47 92H53L57 52Z"/><path d="M36 45H64L59 53H41Z"/><path class="f" d="M50 4C56 16 67 21 63 34C61 41 55 44 50 44C43 44 37 40 37 32C37 24 45 22 43 12C48 18 50 18 50 4Z"/><path class="k" d="M50 22C53 28 57 31 55 36C54 39 52 40 50 40C46 40 44 37 45 33C46 30 49 29 50 22Z" stroke="none"/>${spark(72,14,3)}${spark(28,18,2.6)}${spark(76,34,2.2)}`}
};

/* Pattern motifs: one small device per play in a 20×20 box, repeated half-drop across the cloth (Clothbound-classics style).
   [a] or [a, b] (b alternates with a). Same classes as emblems: f filled, k cut back to the cloth. */
const M=(()=>{const st5=(cx,cy,r)=>{let d="";for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?r*.42:r;d+=(i?"L":"M")+R(cx+q*Math.cos(a))+" "+R(cy+q*Math.sin(a))}return `<path class="f" d="${d}Z"/>`};
 const sunm=(r,n)=>`<circle class="f" cx="10" cy="10" r="${r}"/>`+rays(10,10,r+1.6,r+5,n);
 const rosem=f=>`<circle${f?' class="f"':""} cx="10" cy="10" r="6"/><path${f?' class="k"':""} d="M10 6.6A3.4 3.4 0 1 1 7 10A1.8 1.8 0 1 1 11 10" stroke-width="1.2"/>`;
 const cres=`<path class="f" d="M12 3A7 7 0 1 0 12 17A5.5 5.5 0 1 1 12 3Z"/>`;
 return {
 "othello":[`<path class="f" d="M5 8Q4 16 10 18Q16 16 15 8Q10 6 5 8Z"/><path d="M6 6.5L10 3L14 6.5"/><circle class="k" cx="8" cy="11" r=".8"/><circle class="k" cx="12" cy="11" r=".8"/><circle class="k" cx="10" cy="14" r=".8"/>`],
 "antony-and-cleopatra":[`<path class="f" d="M10 3Q14 9 10 16Q6 9 10 3Z"/><path class="f" d="M3 8Q9 10 10 16Q4 15 3 8ZM17 8Q11 10 10 16Q16 15 17 8Z"/>`,`<path class="f" d="M10 3L18 17H2Z"/><path class="k" d="M10 3L13 17" stroke-width="1"/>`],
 "king-lear":[`<path class="f" d="M12 1L5 11H9L6 19L15 8H11L14 1Z"/>`,`<path d="M6 3L4 8M11 5L9 10M16 3L14 8M8 12L6 17M14 12L12 17" stroke-width="1.3"/>`],
 "tempest":[`<path d="M1 12Q5 6 9 10Q11 12 13 10Q11 7 14 6Q18 6 19 10"/><path d="M1 16Q5 12 10 16T19 16"/>`],
 "twelfth-night":[`<ellipse class="f" cx="7" cy="15" rx="3.6" ry="2.6" transform="rotate(-20 7 15)"/><path d="M10 14V3L16 5"/>`,`<ellipse class="f" cx="5" cy="15" rx="3" ry="2.2" transform="rotate(-20 5 15)"/><ellipse class="f" cx="14" cy="13" rx="3" ry="2.2" transform="rotate(-20 14 13)"/><path d="M7.6 14V4L16.6 2V12"/>`],
 "much-ado":[`<path class="f" d="M10 17C4 12 2 9 4 6C6 3 9 4 10 7C11 4 14 3 16 6C18 9 16 12 10 17Z"/>`,`<path d="M4 4L16 16M16 4L4 16" stroke-width="1.6"/><path d="M3 7L7 3M13 3L17 7" stroke-width="1.6"/>`],
 "midsummer":[cres,st5(10,10,7)],
 "richard-ii":[`<path class="f" d="M3 15L2 6L6.5 10L10 4L13.5 10L18 6L17 15Z"/><path class="k" d="M3 13H17" stroke-width="1"/>`],
 "hamlet":[`<path class="f" d="M4 10C4 5 7 3 10 3C13 3 16 5 16 10C16 12 14 13 14 14V17H6V14C6 13 4 12 4 10Z"/><circle class="k" cx="7.6" cy="10" r="1.8"/><circle class="k" cx="12.4" cy="10" r="1.8"/><path class="k" d="M8 15V17M10 15V17M12 15V17" stroke-width=".9"/>`,`<path d="M10 18V8"/><ellipse class="f" cx="7" cy="9" rx="3" ry="1.3" transform="rotate(30 7 9)"/><ellipse class="f" cx="13" cy="7" rx="3" ry="1.3" transform="rotate(-30 13 7)"/><ellipse class="f" cx="7" cy="14" rx="3" ry="1.3" transform="rotate(30 7 14)"/><ellipse class="f" cx="13" cy="12" rx="3" ry="1.3" transform="rotate(-30 13 12)"/>`],
 "macbeth":[`<path class="f" d="M10 1L12 5V12H8V5Z"/><path d="M5 12.5H15M10 13V18"/>`,`<path class="f" d="M10 4Q14 11 10 15Q6 11 10 4Z"/>`],
 "julius-caesar":[`<path d="M5 18Q8 8 15 3"/><ellipse class="f" cx="7" cy="11" rx="3.2" ry="1.4" transform="rotate(-40 7 11)"/><ellipse class="f" cx="11" cy="12" rx="3.2" ry="1.4" transform="rotate(20 11 12)"/><ellipse class="f" cx="10" cy="7" rx="3.2" ry="1.4" transform="rotate(-50 10 7)"/><ellipse class="f" cx="14" cy="7.5" rx="3.2" ry="1.4" transform="rotate(10 14 7.5)"/>`],
 "as-you-like-it":[`<circle class="f" cx="10" cy="8" r="6"/><path d="M10 12V18M7 18H13"/>`,`<path class="f" d="M6 9Q6 17 10 18Q14 17 14 9Z"/><path class="f" d="M5 9Q10 4 15 9Z"/><path d="M10 6V3"/>`],
 "romeo-and-juliet":[st5(10,10,8),`<path class="f" d="M10 16C5 12 3 9 5 6.5C7 4 9.5 5 10 7.5C10.5 5 13 4 15 6.5C17 9 15 12 10 16Z"/>`],
 "two-gentlemen":[`<rect x="3" y="5" width="14" height="10" rx="1"/><path d="M3 5L10 11L17 5"/>`],
 "alls-well":[`<circle cx="10" cy="12" r="5"/><path class="f" d="M7.6 6.4L10 3L12.4 6.4L10 8Z"/>`],
 "merchant-of-venice":[`<circle cx="10" cy="10" r="6.5"/><circle class="f" cx="10" cy="10" r="3"/>`,`<path d="M10 3V17M4 6H16M7 17H13"/><path class="f" d="M2 11Q4 14 6 11ZM14 11Q16 14 18 11Z"/><path d="M4 6L2 11M4 6L6 11M16 6L14 11M16 6L18 11" stroke-width=".8"/>`],
 "loves-labours-lost":[`<path class="f" d="M16 2Q8 6 5 15Q12 10 16 2Z"/><path d="M5 15L3 18"/>`],
 "taming-of-the-shrew":[sunm(3.6,8),cres],
 "comedy-of-errors":[`<ellipse cx="6.5" cy="10" rx="5" ry="3"/><ellipse cx="13.5" cy="10" rx="5" ry="3"/>`],
 "measure-for-measure":[`<path d="M5 3H15M5 17H15"/><path class="f" d="M6 4Q6 9 10 10Q14 9 14 4ZM10 10Q6 11 6 16H14Q14 11 10 10Z"/>`],
 "merry-wives":[`<path class="f" d="M3 8H17L15 17H5Z"/><path class="k" d="M6.5 8L8 17M10 8V17M13.5 8L12 17M4 12.5H16" stroke-width=".9"/><path d="M6 8Q10 1 14 8"/>`,`<path d="M10 18V11M10 11Q5 9 4 3M5.5 7L2 6M10 11Q15 9 16 3M14.5 7L18 6" stroke-width="1.5"/>`],
 "winters-tale":[rays(10,10,0,8,6,Math.PI/6)+`<path d="M10 5L8 3M10 5L12 3M10 15L8 17M10 15L12 17" stroke-width="1.2"/>`],
 "titus-andronicus":[`<path class="f" d="M10 3Q15 11 10 16Q5 11 10 3Z"/>`,`<path d="M4 17H16M5 5H15M7 5V17M10 5V17M13 5V17" stroke-width="1.4"/><path class="f" d="M4 5L10 2L16 5Z"/>`],
 "troilus-and-cressida":[`<path d="M3 17L16 4"/><path class="f" d="M17 3L11 5L15 9Z"/><path d="M3 17L2 13M3 17L7 18"/>`],
 "timon-of-athens":[`<path class="f" d="M5 3H15Q15 10 10 11Q5 10 5 3Z"/><path d="M10 11V17M6 17H14"/>`,`<circle cx="10" cy="10" r="5"/><circle class="f" cx="10" cy="10" r="2"/>`],
 "coriolanus":[`<path class="f" d="M10 2C13 4 11 6 14 7C16 9 12 10 15 12C16 15 12 14 11 17H9C8 14 4 15 5 12C8 10 4 9 6 7C9 6 7 4 10 2Z"/><path class="k" d="M10 4V18" stroke-width="1"/>`],
 "cymbeline":[(()=>{let s="";for(let i=0;i<8;i++){const a=i*Math.PI/4,x=10+5*Math.cos(a),y=10+5*Math.sin(a);s+=`<ellipse class="f" cx="${R(x)}" cy="${R(y)}" rx="3" ry="1.5" transform="rotate(${R(a*180/Math.PI)} ${R(x)} ${R(y)})"/>`}return s+`<circle class="k" cx="10" cy="10" r="2"/>`})()],
 "king-john":[`<path class="f" d="M10 3Q13 8 10 12Q7 8 10 3Z"/><path class="f" d="M10 12Q4 10 3 5Q8 6 10 12ZM10 12Q16 10 17 5Q12 6 10 12Z"/><path d="M10 12V18"/>`],
 "henry-iv-part-1":[rays(10,10,0,8,8,0)+`<circle class="f" cx="10" cy="10" r="3"/><circle class="k" cx="10" cy="10" r="1.2"/>`],
 "henry-v":[`<path class="f" d="M10 2C7 6 7 10 9 13H11C13 10 13 6 10 2Z"/><path class="f" d="M9 13C5 13 2 11 3 7C4 5 6 6 6 7.5C5 8 6 10 9 13ZM11 13C15 13 18 11 17 7C16 5 14 6 14 7.5C15 8 14 10 11 13Z"/><rect class="f" x="6" y="12.6" width="8" height="2" rx=".6"/><path d="M10 14.6V18M8.6 15Q8 17 6 17.6M11.4 15Q12 17 14 17.6" stroke-width="1.3"/>`],
 "henry-iv-part-2":[`<circle class="f" cx="10" cy="12" r="5"/><path d="M10 7V2M8 4H12"/><path class="k" d="M5 12H15" stroke-width="1"/>`],
 "henry-vi-part-1":[rosem(1),rosem(0)],
 "henry-vi-part-3":[sunm(3.4,12)],
 "henry-viii":[`<circle cx="10" cy="10" r="7"/><circle class="f" cx="10" cy="10" r="3.4"/><circle class="f" cx="10" cy="3" r="1.2"/><circle class="f" cx="10" cy="17" r="1.2"/><circle class="f" cx="3" cy="10" r="1.2"/><circle class="f" cx="17" cy="10" r="1.2"/>`],
 "richard-iii":[`<path d="M5 17V9A5 5 0 0 1 15 9V17" stroke-width="2.6"/><circle class="k" cx="5" cy="11" r=".7"/><circle class="k" cx="15" cy="11" r=".7"/><circle class="k" cx="6" cy="6" r=".7"/><circle class="k" cx="14" cy="6" r=".7"/>`,`<path class="f" d="M3 15L2 6L6.5 10L10 4L13.5 10L18 6L17 15Z"/>`],
 "henry-vi-part-2":[`<path class="f" d="M10 2C12 6 16 8 15 12C14 16 12 17 10 17C7 17 5 15 5 12C5 9 8 8 7 4C9 6 10 6 10 2Z"/>`]
 }})();
const GILT="#ebc96c";
/* the cloth pattern for a play as a CSS url(): motif in gilt, "k" parts in the cloth colour; tile 48px, half-drop */
const patCache={};
window.coverPattern=id=>{if(patCache[id])return patCache[id];const m=M[id],c=window.coverColor(id);if(!m)return"none";
  const paint=s=>s.replace(/class="f"/g,`fill="${GILT}" stroke="none"`).replace(/class="k"/g,`fill="${c}" stroke="${c}"`);
  const a=paint(m[0]),b=paint(m[1]||m[0]);
  const s=`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><g fill="none" stroke="${GILT}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(2 2)">${a}</g><g transform="translate(26 26)">${b}</g></g></svg>`;
  return patCache[id]=`url('data:image/svg+xml,${encodeURIComponent(s).replace(/'/g,"%27").replace(/\(/g,"%28").replace(/\)/g,"%29")}')`};
const ORN={Comedies:`<circle cx="12" cy="12" r="9"/><path class="k" d="M7 9.5Q8.5 8 10 9.5M14 9.5Q15.5 8 17 9.5M7 14Q12 19 17 14" stroke-width="1.6" fill="none"/>`,
 Tragedies:`<circle cx="12" cy="12" r="9"/><path class="k" d="M7 8.5Q8.5 10 10 8.5M14 8.5Q15.5 10 17 8.5M7.5 17Q12 12.5 16.5 17" stroke-width="1.6" fill="none"/>`,
 Histories:`<path d="M3 18L2 7L7.5 11.5L12 4L16.5 11.5L22 7L21 18Z"/><path class="k" d="M3 15.5H21" stroke-width="1.2" fill="none"/>`};
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
const svg=(inner,cls)=>`<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const BANNER=`<svg class="bn" viewBox="0 0 200 44" preserveAspectRatio="none" aria-hidden="true"><path class="tl" d="M18 12H2L9 24L2 36H18Z"/><path class="tl" d="M182 12H198L191 24L198 36H182Z"/><path class="fd" d="M18 36L26 40V32ZM182 36L174 40V32Z"/><path class="bd" d="M26 4H174V40H26Z"/><path class="ed" d="M26 7H174M26 37H174" fill="none"/></svg>`;
window.emblemSVG=(id,cls="emb")=>{const k=window.COVER[id];return k?svg(k.e,cls):""};
/* stat = folio-stat-<id> or null; returns the inner markup of a .cover link */
window.coverHTML=(p,st)=>{const k=window.COVER[p.id]||{},t=p.title||"",n=t.length;
  return `<span class="pat" aria-hidden="true" style="background-image:${window.coverPattern(p.id)}"></span><span class="hinge" aria-hidden="true"></span><span class="shine" aria-hidden="true"></span>
  <span class="badge" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor">${ORN[p.group]||ORN.Comedies}</svg></span>
  ${st?'<span class="ribbon" aria-hidden="true"></span>':""}
  <span class="cin"><span class="med">${k.e?svg(k.e,"emb"):'<span class="o">❦</span>'}</span>
  <span class="plate"><span class="pre">${esc(p.pre||"")}</span><span class="t${n>20?" xl":n>12?" long":""}">${esc(t)}</span><span class="yr">${esc(p.year||"")}</span></span>
  ${k.q?`<span class="scroll">${BANNER}<span class="q">${esc(k.q)}</span></span>`:""}</span>
  ${st?`<span class="cp"><i style="width:${Math.max(2,Math.min(100,+st.pct||0))}%"></i></span>`:""}`};
})();
