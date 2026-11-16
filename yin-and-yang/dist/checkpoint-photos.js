export const checkpointPhotoLimit=3;
const maxEncodedSize=100_000;
const photoPrefix='data:image/jpeg;base64,';
const maxSourceSize=20*1024*1024;
const imageTypes=['image/jpeg','image/png','image/webp'];

export function loadCheckpointPhotos(value){
  return (Array.isArray(value)?value:[]).filter(photo=>typeof photo?.src==='string'&&
    photo.src.length<=maxEncodedSize&&photo.src.startsWith(photoPrefix)&&/^[A-Za-z0-9+/]+={0,2}$/.test(photo.src.slice(photoPrefix.length)))
    .slice(0,checkpointPhotoLimit).map(photo=>({
      src:photo.src,name:typeof photo.name==='string'?photo.name.trim().slice(0,120)||'Progress photo':'Progress photo'
    }));
}

export async function encodeCheckpointPhoto(file){
  if(!imageTypes.includes(file.type)||file.size>maxSourceSize)throw Error('Choose JPEG, PNG, or WebP images up to 20 MB each.');
  let image;
  try{image=await createImageBitmap(file);}
  catch{throw Error('A selected photo could not be opened. Try a different image.');}
  try{
    const canvas=document.createElement('canvas');
    const context=canvas.getContext('2d',{alpha:false});
    if(!context)throw Error('This browser could not prepare the photo.');
    for(const edge of [1100,800,560,360]){
      const scale=Math.min(1,edge/Math.max(image.width,image.height));
      canvas.width=Math.max(1,Math.round(image.width*scale));
      canvas.height=Math.max(1,Math.round(image.height*scale));
      context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);
      context.drawImage(image,0,0,canvas.width,canvas.height);
      for(const quality of [.82,.68]){
        const src=canvas.toDataURL('image/jpeg',quality);
        if(src.length<=maxEncodedSize)return {src,name:file.name.slice(0,120)||'Progress photo'};
      }
    }
    throw Error('This photo is too detailed to save. Try cropping or resizing it first.');
  }finally{image.close();}
}
