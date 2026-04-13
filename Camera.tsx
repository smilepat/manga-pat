/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useRef, useState, useEffect } from 'react';

interface CameraProps {
    onCapture: (base64: string) => void;
    onClose: () => void;
}

export const Camera: React.FC<CameraProps> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
            .then(stream => {
                if (videoRef.current) videoRef.current.srcObject = stream;
            })
            .catch(err => setError("카메라에 접근할 수 없거나 권한이 없습니다."));
        
        return () => {
            // Cleanup stream
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const takePhoto = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
        const base64 = canvas.toDataURL("image/jpeg").split(",")[1];
        onCapture(base64);
    };

    return (
        <div className="fixed inset-0 z-[500] bg-black/90 flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-black border-4 border-white rounded-lg overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                {error ? (
                    <div className="text-white p-8 text-center font-comic">{error}</div>
                ) : (
                    <video ref={videoRef} autoPlay playsInline className="w-full h-auto transform scale-x-[-1]" />
                )}
                
                <div className="absolute bottom-4 inset-x-0 flex justify-center gap-4">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white font-comic uppercase rounded hover:bg-gray-500">취소</button>
                    {!error && (
                        <button onClick={takePhoto} className="px-6 py-2 bg-red-600 text-white font-comic uppercase rounded hover:bg-red-500 border-2 border-white shadow-lg">
                            사진 촬영 📸
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};