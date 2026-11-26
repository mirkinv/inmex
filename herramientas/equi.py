import cv2, numpy as np
pan=cv2.imread('cyl.jpg'); valid=np.load('valid.npy')
Hc,Wc=pan.shape[:2]; fc=Wc/(2*np.pi)
# rango vertical valido (filas con >97% de columnas validas)
rows=np.where(valid.mean(1)>0.97)[0]; top,bot=rows[0]+4,rows[-1]-4
band=pan[top:bot].copy(); cy=Hc/2
W=4096; H=2048; s=W/Wc
band=cv2.resize(band,(W,int((bot-top)*s)),interpolation=cv2.INTER_AREA)
f=fc*s; yc=(cy-top)*s
lat=(np.arange(H)+0.5)/H*np.pi-np.pi/2      # -90 arriba ... +90 abajo
yb=f*np.tan(np.clip(lat,-1.45,1.45))+yc
out=np.zeros((H,W,3),np.uint8)
inside=(yb>=0)&(yb<band.shape[0]-1)
r=np.where(inside)[0]; print('lat cubierta', np.degrees(lat[r[0]]), np.degrees(lat[r[-1]]))
mapy=np.repeat(yb[r,None],W,1).astype(np.float32); mapx=np.repeat(np.arange(W,dtype=np.float32)[None,:],len(r),0)
out[r]=cv2.remap(band,mapx,mapy,cv2.INTER_LINEAR)
# relleno cielo y piso: color medio por columna, suavizado, con fundido
def relleno(fila_ref, filas, hacia_borde):
    ref=out[fila_ref].astype(np.float32)
    ref=cv2.GaussianBlur(np.repeat(ref[None],3,0),(0,0),sigmaX=400)[1]
    lejos=ref.mean(0)
    for k,i in enumerate(filas):
        t=k/len(filas)
        out[i]=(ref*(1-t)+lejos*t).astype(np.uint8)
t0,t1=r[0],r[-1]
relleno(t0+30, list(range(t0-1,-1,-1)), True)
relleno(t1-30, list(range(t1+1,H)), True)
# fundido suave en las uniones
orig=out.copy()
for k in range(30):
    a=k/30
    out[t0+k]=(orig[t0+k]*a+orig[t0-1]*(1-a)).astype(np.uint8)
    out[t1-k]=(orig[t1-k]*a+orig[t1+1]*(1-a)).astype(np.uint8)
m=np.zeros((H,1),np.float32); m[t0+40:t1-40]=1; m=cv2.GaussianBlur(m,(1,0),sigmaX=1,sigmaY=25)
cv2.imwrite('calle360.jpg',out,[cv2.IMWRITE_JPEG_QUALITY,88])
cv2.imwrite('calle360_prev.jpg',cv2.resize(out,(1600,800)))
