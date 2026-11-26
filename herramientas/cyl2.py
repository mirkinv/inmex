import cv2, numpy as np, glob
fs=sorted(glob.glob('amb6/f_*.jpg')); ims=[cv2.imread(f) for f in fs]; n=len(ims)
H0,W0=ims[0].shape[:2]
orb=cv2.ORB_create(3000); bf=cv2.BFMatcher(cv2.NORM_HAMMING,crossCheck=True)
def shift(a,b):
    ga=cv2.cvtColor(a,cv2.COLOR_BGR2GRAY); gb=cv2.cvtColor(b,cv2.COLOR_BGR2GRAY)
    k1,d1=orb.detectAndCompute(ga,None); k2,d2=orb.detectAndCompute(gb,None)
    m=bf.match(d1,d2)
    p1=np.float32([k1[x.queryIdx].pt for x in m]); p2=np.float32([k2[x.trainIdx].pt for x in m])
    M,inl=cv2.estimateAffinePartial2D(p1,p2,ransacReprojThreshold=3)
    return M[0,2],M[1,2],int(inl.sum())
def cylw(img,f):
    h,w=img.shape[:2]; yy,xx=np.indices((h,w),dtype=np.float32)
    th=(xx-w/2)/f; hh=(yy-h/2)/f
    X=np.tan(th)*f+w/2; Y=hh/np.cos(th)*f+h/2
    return cv2.remap(img,X,Y,cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)
# estimate f from raw shifts
step=2; idx=list(range(0,n,step))
if idx[-1]!=n-1: idx.append(n-1)
raw=[shift(ims[idx[i]],ims[idx[i+1]]) for i in range(len(idx)-1)]
tot=-sum(r[0] for r in raw)
print('suma dx',tot,'inliers min',min(r[2] for r in raw))
f=abs(tot)/(2*np.pi); print('f estimado',f,'FOV horiz',np.degrees(2*np.arctan(W0/2/f)))
np.save('f.npy',f)
