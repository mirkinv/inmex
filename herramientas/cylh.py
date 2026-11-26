import cv2, numpy as np, glob
fs=sorted(glob.glob('amb6/f_*.jpg')); ims=[cv2.imread(f) for f in fs]; n=len(ims)
H0,W0=ims[0].shape[:2]; f=float(np.load('f.npy'))
orb=cv2.ORB_create(3000); bf=cv2.BFMatcher(cv2.NORM_HAMMING,crossCheck=True)
def cylw(img):
    h,w=img.shape[:2]; yy,xx=np.indices((h,w),dtype=np.float32)
    th=(xx-w/2)/f; hh=(yy-h/2)/f
    X=np.tan(th)*f+w/2; Y=hh/np.cos(th)*f+h/2
    out=cv2.remap(img,X,Y,cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)
    m=cv2.remap(np.full((h,w),255,np.uint8),X,Y,cv2.INTER_NEAREST,borderMode=cv2.BORDER_CONSTANT)
    return out,m
def shift(a,b,ma,mb):
    ga=cv2.cvtColor(a,cv2.COLOR_BGR2GRAY); gb=cv2.cvtColor(b,cv2.COLOR_BGR2GRAY)
    k1,d1=orb.detectAndCompute(ga,ma); k2,d2=orb.detectAndCompute(gb,mb)
    m=bf.match(d1,d2)
    p1=np.float32([k1[x.queryIdx].pt for x in m]); p2=np.float32([k2[x.trainIdx].pt for x in m])
    d=p2-p1
    M,inl=cv2.estimateAffinePartial2D(p1,p2,ransacReprojThreshold=3)
    s=inl.ravel()==1
    return float(np.median(d[s,0])),float(np.median(d[s,1])),int(s.sum())
# choose sharpest frame in each window of 3
g=[cv2.cvtColor(cv2.resize(i,None,fx=.5,fy=.5),cv2.COLOR_BGR2GRAY) for i in ims]
sh=[cv2.Laplacian(x,cv2.CV_64F).var() for x in g]
sel=[]
sel=list(range(0,n-1))
sel.append(n-1)
W=[cylw(ims[i]) for i in sel]
pos=[(0.0,0.0)]
for i in range(len(sel)-1):
    dx,dy,k=shift(W[i][0],W[i+1][0],W[i][1],W[i+1][1])
    pos.append((pos[-1][0]-dx,pos[-1][1]-dy))
# last frame ~ first frame: closure
cx,cy=pos[-1]; print('cierre dx',cx,'dy',cy,'esperado 2pi f',2*np.pi*f)
L=abs(cx); ncount=len(pos)-1
sgn=np.sign(cx)
pos=[(sgn*p[0]*(L/abs(cx)) , p[1]-cy*i/ncount) for i,p in enumerate(pos)]
Wc=int(round(L)); Hc=H0+200
acc=np.zeros((Hc,Wc,3),np.float64); wsum=np.zeros((Hc,Wc),np.float64)
# feather weight: distance to edge horizontally
wx=np.exp(-((np.arange(W0)-W0/2)/70.0)**2)
SH=[sh[i]/max(sh) for i in sel]
for k,((img,m),(px,py)) in enumerate(zip(W[:-1],pos[:-1])):
    x0=int(round(px*sgn)) if sgn<0 else int(round(px)); x0=int(round(abs(px))) if sgn<0 else int(round(px))
    y0=int(round(py))+100
    wt=(m>0)*wx[None,:]*(SH[k]**2)
    for xs in range(W0):
        pass
    cols=(np.arange(W0)+x0)%Wc
    acc[y0:y0+H0][:,cols]+=img*wt[...,None]; wsum[y0:y0+H0][:,cols]+=wt
pan=(acc/np.maximum(wsum,1e-6)[...,None]).astype(np.uint8)
valid=wsum>1e-5
cv2.imwrite('cyl.jpg',pan); np.save('valid.npy',valid)
print(pan.shape)
