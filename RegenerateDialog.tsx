
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Beat } from './types';

interface RegenerateDialogProps {
    initialBeat: Beat;
    onClose: () => void;
    onRegenerate: (updatedBeat: Beat) => void;
}

export const RegenerateDialog: React.FC<RegenerateDialogProps> = ({ initialBeat, onClose, onRegenerate }) => {
    const [beat, setBeat] = useState<Beat>(initialBeat);

    return (
        <div className="fixed inset-0 z-[500] bg-black/80 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                <div className="flex justify-between items-center border-b pb-4">
                    <h3 className="font-title text-xl text-gray-900">페이지 재생성 (Regenerate)</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl" aria-label="닫기">&times;</button>
                </div>
                <p className="text-sm text-gray-500">장면 설명이나 대사를 수정하여 다시 그려보세요.</p>
                
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">장면 묘사 (Scene Description)</label>
                    <textarea 
                        className="studio-input h-24 resize-none"
                        value={beat.scene}
                        onChange={(e) => setBeat({...beat, scene: e.target.value})}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">내레이션 (Caption)</label>
                        <input 
                            className="studio-input"
                            value={beat.caption || ''}
                            onChange={(e) => setBeat({...beat, caption: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">대사 (Dialogue)</label>
                        <input 
                            className="studio-input"
                            value={beat.dialogue || ''}
                            onChange={(e) => setBeat({...beat, dialogue: e.target.value})}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <button onClick={onClose} className="studio-btn bg-gray-200 text-gray-700 hover:bg-gray-300">취소</button>
                    <button onClick={() => onRegenerate(beat)} className="studio-btn bg-green-600 text-white hover:bg-green-700 shadow-lg">
                        재생성 🔄
                    </button>
                </div>
            </div>
        </div>
    );
};
