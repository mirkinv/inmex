import cv2, numpy as np, glob, json
fs=sorted(glob.glob('cam/f_*.jpg')); det=json.load(open('det.json')); n=len(fs)
g=[cv2.Laplacian(cv2.cvtColor(cv2.resize(cv2.imread(f),None,fx=.4,fy=.4),cv2.COLOR_BGR2GRAY),cv2.CV_64F).var() for f in fs]
N=36; sel=[]
for k in range(N):
    a,b=int(k*n/N),int((k+1)*n/N)
    cand=[i for i in range(a,b) if det[i]]
    sel.append(max(cand,key=lambda i:g[i]))
B=np.array([det[i][:4] for i in sel])
cx=B[:,0]+B[:,2]/2; cy=B[:,1]+B[:,3]/2; hh=B[:,3]
def suav(v,k=2):  # media movil circular
    return np.array([np.mean([v[(i+j)%len(v)] for j in range(-k,k+1)]) for i in range(len(v))])
cx,cy,hh=suav(cx),suav(cy),suav(hh)
OW,OH=720,1280; target=None
import os; os.makedirs('spin',exist_ok=True)
for k,i in enumerate(sel):
    im=cv2.imread(fs[i]); h,w=im.shape[:2]
    s=1.0
    M=np.float32([[s,0,OW/2-s*cx[k]],[0,s,OH*0.5-s*cy[k]]])
    fondo=cv2.GaussianBlur(cv2.resize(im,(OW,OH)),(0,0),25)
    out=cv2.warpAffine(im,M,(OW,OH),borderMode=cv2.BORDER_CONSTANT)
    msk=cv2.warpAffine(np.full((h,w),255,np.uint8),M,(OW,OH))
    msk=cv2.GaussianBlur(msk,(0,0),6)[...,None]/255.0
    out=(out*msk+fondo*(1-msk)).astype(np.uint8)
    cv2.imwrite(f'spin/{k:02d}.jpg',out,[cv2.IMWRITE_JPEG_QUALITY,85])
print('listo')
