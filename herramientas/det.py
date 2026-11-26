import cv2, numpy as np, glob, onnxruntime as ort, json
s=ort.InferenceSession('/tmp/yolo11n-seg.onnx')
fs=sorted(glob.glob('cam/f_*.jpg')); res=[]
for f in fs:
    im=cv2.imread(f); h,w=im.shape[:2]; r=640/max(h,w)
    nh,nw=int(h*r),int(w*r); pad=np.full((640,640,3),114,np.uint8); pad[:nh,:nw]=cv2.resize(im,(nw,nh))
    x=pad[:,:,::-1].transpose(2,0,1)[None].astype(np.float32)/255
    o0,o1=s.run(None,{'images':x}); p=o0[0].T  # 8400x116
    cls=p[:,4:84]; best=np.zeros(len(p))
    sc=np.maximum(cls[:,2],cls[:,7]); k=sc>0.3
    if not k.any(): res.append(None); continue
    P=p[k]; S=sc[k]
    bx=P[:,:4].copy(); bx[:,0]-=bx[:,2]/2; bx[:,1]-=bx[:,3]/2
    idx=cv2.dnn.NMSBoxes(bx.tolist(),S.tolist(),0.3,0.5)
    idx=np.array(idx).ravel()
    # elegir: mayor area * cercania al centro
    def score(i):
        x0,y0,bw,bh=bx[i]; cx=(x0+bw/2)/r/w; return bw*bh*(1.2-abs(cx-0.5))
    i=max(idx,key=score); x0,y0,bw,bh=bx[i]/r
    coef=P[i,84:]; m=(1/(1+np.exp(-(coef@o1[0].reshape(32,-1))))).reshape(160,160)
    m=cv2.resize(m,(640,640))[:nh,:nw]; m=cv2.resize(m,(w,h))
    bm=np.zeros_like(m); xi0,yi0=max(0,int(x0)),max(0,int(y0)); bm[yi0:int(y0+bh),xi0:int(x0+bw)]=1; m=m*bm
    np.save(f.replace('.jpg','_m.npy'),(m*255).astype(np.uint8))
    res.append([float(x0),float(y0),float(bw),float(bh),float(S[i])])
json.dump(res,open('det.json','w')); print(sum(r is None for r in res),'sin deteccion de',len(res))
