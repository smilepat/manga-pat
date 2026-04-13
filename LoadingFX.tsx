
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';

const STUDIO_TASKS = [
    "시나리오 분석 중...",
    "캐릭터 디자인 렌더링...",
    "조명 설정 중...",
    "카메라 앵글 조정...",
    "배경 작화 채색...",
    "특수 효과 합성 중...",
    "최종 렌더링 패스..."
];

export const LoadingFX: React.FC = () => {
    const [task, setTask] = useState(STUDIO_TASKS[0]);

    useEffect(() => {
        const taskInterval = setInterval(() => {
            setTask(STUDIO_TASKS[Math.floor(Math.random() * STUDIO_TASKS.length)]);
        }, 2000);

        return () => {
            clearInterval(taskInterval);
        };
    }, []);

    return (
        <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Abstract Film Strip Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                 <div className="w-full h-full" style={{
                     backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 50px, #333 50px, #333 52px)`,
                     backgroundSize: '100% 100%'
                 }}/>
            </div>

            <div className="z-10 flex flex-col items-center gap-6">
                <div className="relative w-24 h-24">
                    <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl text-white font-title">REC</span>
                    </div>
                </div>

                <div className="text-center">
                    <h3 className="text-white font-body text-lg font-bold mb-2 tracking-widest animate-pulse">{task}</h3>
                    <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                        <div className="h-full bg-blue-500 rounded-full loading-bar-indeterminate"></div>
                    </div>
                </div>
            </div>

            {/* Film Perforations */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-black flex justify-between px-2 items-center opacity-50">
                 {Array.from({length: 10}).map((_,i) => <div key={i} className="w-4 h-5 bg-gray-800 rounded-sm mx-1"/>)}
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-black flex justify-between px-2 items-center opacity-50">
                 {Array.from({length: 10}).map((_,i) => <div key={i} className="w-4 h-5 bg-gray-800 rounded-sm mx-1"/>)}
            </div>
        </div>
    );
};
