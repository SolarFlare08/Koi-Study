export const bookendDesigns={
  jade:{name:'Jade arch',art:'<path fill="#326e62" stroke="#90c4a9" d="M5 53V27a13 13 0 0 1 26 0v26h-8V27a5 5 0 0 0-10 0v26Z"/><path fill="#81bda3" d="M4 51h29v5H4Z"/><path stroke="#9ed7ae" d="m6 36 6-8m12 10 6-8"/>'},
  moon:{name:'Brass moon',art:'<path fill="#bd893f" stroke="#f1cd89" d="M23 10a17 17 0 1 0 9 29A18 18 0 0 1 23 10Z"/><path fill="#f9d897" d="M20 14a14 14 0 0 0-6 27l-3-2a13 13 0 0 1 9-25Z"/><path fill="#f1cd89" d="m29 13 1 4 4 1-4 1-1 4-1-4-4-1 4-1Z"/><path fill="#ac7b40" d="m14 45 7-2 5 9H10ZM4 52h28v4H4Z"/>'},
  granite:{name:'Stone peaks',art:'<path fill="#869598" d="m2 52 11-21 5 8 9-19 8 32Z"/><path fill="#53696f" d="m13 31 2 21H2Zm14-11 1 32H14Z"/><path fill="#d4dfdf" d="m13 31 4 6-4-1-4 4Zm14-11 3 12-3-3-5 1Z"/><path fill="#697d80" d="M1 52h34v4H1Z"/>'},
  cat:{name:'Porcelain cat',art:'<path fill="#dbe3d9" stroke="#81999e" d="M10 33 8 18l9 6a13 13 0 0 1 7 0l7-7-1 17c4 9 3 17-4 19H12c-9 0-12-5-7-8l4 2c-1-5 0-10 1-14Z"/><path stroke="#537f91" stroke-width="1.25" stroke-linecap="round" fill="none" d="M16 33h1m8 0h1m-7 4q2 2 4 0m-8 6q7 5 14 2"/><path fill="#7f9b9d" d="M4 52h29v4H4Z"/>'}
};
export function bookendArt(kind,facing){
  return `<svg viewBox="0 0 36 58" aria-hidden="true" focusable="false"><g${facing==='right'?' transform="translate(36 0) scale(-1 1)"':''}>${bookendDesigns[kind].art}</g></svg>`;
}
