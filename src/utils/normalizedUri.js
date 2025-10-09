const isCid = (s) => /^[A-Za-z0-9]{46,}$/.test((s || '').trim());

export const normalizeUri = (u) => {
  if (!u) return '';
  let s = String(u).trim().replace(/^"+|"+$/g, '');

 
  if (s.startsWith('ipfs://')) return `https://ipfs.io/ipfs/${s.slice(7)}`;


  if (isCid(s)) return `https://ipfs.io/ipfs/${s}`;


  if (s.startsWith('file://') || s.startsWith('content://') || /^https?:\/\//i.test(s)) return s;

  if (s[0] === '/' || /^[A-Za-z]:\\/.test(s)) return `file://${s}`;

  return s;
};


export const buildIpfsCandidates = (uri) => {
  const m = String(uri).match(/(?:ipfs:\/\/|\/ipfs\/)?([A-Za-z0-9]{46,})/);
  const cid = m?.[1];
  if (!cid) return [normalizeUri(uri)];

  return [
    `https://ipfs.io/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`,
    `https://gateway.pinata.cloud/ipfs/${cid}`,
    `https://dweb.link/ipfs/${cid}`,
  ];
};
