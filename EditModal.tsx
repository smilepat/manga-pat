
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';

interface EditModalProps {
    imageUrl: string;
    onClose: () => void;
    onApply: (imageWithMark: string, instruction: string) => void;
}

export const EditModal: React.FC<EditModalProps> = ({ imageUrl, onClose, onApply }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [instruction, setInstruction] = useState("");
    const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        setContext(ctx);

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;
        img.onload = () => {
            const maxWidth = 800; 
            const scale = Math.min(1, maxWidth / img.width);
            
            canvas.width = img.width;
            canvas.height = img.height;
            
            ctx.drawImage(img, 0, 0, img.width, img.height);
            
            ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
            ctx.lineWidth = img.width * 0.015;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
        };
    }, [imageUrl]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (!context) return;
        setIsDrawing(true);
        const pos = getPos(e);
        context.beginPath();
        context.moveTo(pos.x, pos.y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !context) return;
        const pos = getPos(e);
        context.lineTo(pos.x, pos.y);
        context.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        if (context) context.closePath();
    };

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const handleApply = () => {
        if (!canvasRef.current) return;
        const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.9);
        const base64 = dataUrl.split(",")[1];
        onApply(base64, instruction);
    };

    return (
        <div className="fixed inset-0 z-[500] bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl overflow-hidden shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh]">
                <div className="bg-gray-100 p-4 border-b flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🖍️</span>
                        <div>
                            <h3 className="font-title text-xl text-gray-900">장면 수정</h3>
                            <p className="text-xs text-gray-500 font-body">수정할 부분을 붉은색으로 표시하고 내용을 입력하세요.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 font-bold text-2xl" aria-label="닫기">&times;</button>
                </div>

                <div className="flex-1 overflow-auto bg-gray-800 flex justify-center items-center p-4 cursor-crosshair touch-none">
                     <canvas 
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="max-w-full shadow-lg border-2 border-white/20"
                        style={{ maxHeight: '50vh' }}
                     />
                </div>

                <div className="p-6 bg-white border-t space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">수정 지시사항 (Prompt)</label>
                        <input 
                            type="text" 
                            value={instruction}
                            onChange={(e) => setInstruction(e.target.value)}
                            placeholder="예: 인물의 의상을 관복으로 바꿔줘, 배경에 경복궁을 추가해줘"
                            className="studio-input"
                            autoFocus
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={onClose} className="studio-btn bg-gray-200 text-gray-700 hover:bg-gray-300">취소</button>
                        <button 
                            onClick={handleApply} 
                            disabled={!instruction.trim()}
                            className="studio-btn bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
                        >
                            수정 반영하기 ✨
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
