import React from 'react';
import { Settings } from '../types';
import { ExternalLink, ShieldAlert, CreditCard } from 'lucide-react';

interface SettingsViewProps {
  settings: Settings;
  onUpdate: (s: Settings) => void;
  apiKey: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdate, apiKey }) => {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">设置</h2>
      
      <div className="space-y-6">
        
        {/* Learning Config */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">学习偏好</h3>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
               <div>
                 <p className="font-medium text-gray-900">每日新词目标</p>
                 <p className="text-sm text-gray-500">你希望每天掌握多少个新单词？</p>
               </div>
               <input 
                 type="number" 
                 min="5" 
                 max="100" 
                 value={settings.dailyGoal}
                 onChange={(e) => onUpdate({...settings, dailyGoal: parseInt(e.target.value) || 10})}
                 className="w-20 p-2 border border-gray-300 rounded-lg text-center font-semibold"
               />
            </div>

            <div className="flex items-center justify-between">
               <div>
                 <p className="font-medium text-gray-900">自动发音</p>
                 <p className="text-sm text-gray-500">切换到新单词时自动播放读音。</p>
               </div>
               <button 
                 onClick={() => onUpdate({...settings, autoPronounce: !settings.autoPronounce})}
                 className={`w-12 h-6 rounded-full transition-colors relative ${settings.autoPronounce ? 'bg-indigo-600' : 'bg-gray-300'}`}
               >
                 <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.autoPronounce ? 'left-7' : 'left-1'}`}></div>
               </button>
            </div>

            <div className="flex items-center justify-between">
               <div>
                 <p className="font-medium text-gray-900">按键音效</p>
                 <p className="text-sm text-gray-500">记忆反馈时播放提示音。</p>
               </div>
               <button 
                 onClick={() => onUpdate({...settings, enableSoundEffects: !settings.enableSoundEffects})}
                 className={`w-12 h-6 rounded-full transition-colors relative ${settings.enableSoundEffects ? 'bg-indigo-600' : 'bg-gray-300'}`}
               >
                 <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.enableSoundEffects ? 'left-7' : 'left-1'}`}></div>
               </button>
            </div>

            <div className="flex items-center justify-between">
               <div>
                 <p className="font-medium text-gray-900">发音偏好</p>
                 <p className="text-sm text-gray-500">选择美式发音 (US) 或英式发音 (UK)。</p>
               </div>
               <div className="flex bg-gray-100 rounded-lg p-1">
                 <button 
                  onClick={() => onUpdate({...settings, accent: 'US'})}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${settings.accent === 'US' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                   美音
                 </button>
                 <button 
                  onClick={() => onUpdate({...settings, accent: 'UK'})}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${settings.accent === 'UK' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                   英音
                 </button>
               </div>
            </div>
          </div>
        </div>

        {/* API Info */}
        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-blue-900">Google Gemini API 配置</h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-blue-100 shadow-sm">
              <div className={`w-2.5 h-2.5 rounded-full ${apiKey ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-xs font-bold text-blue-900">
                {apiKey ? '已连接' : '未连接'}
              </span>
            </div>
          </div>
          
          <p className="text-blue-800 text-sm mb-6 leading-relaxed">
             本应用使用 Google Gemini 进行智能文档解析。如果您在中国大陆，可能需要网络代理才能连接。如果连接失败，系统会自动切换到无需 Key 的基础模式。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/60 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-blue-900 font-semibold mb-1">
                <CreditCard className="w-4 h-4" />
                <span>费用说明</span>
              </div>
              <p className="text-xs text-blue-700">
                Gemini Flash 模型提供免费额度（Free Tier），个人学习通常无需付费。
              </p>
            </div>
            
            <div className="bg-white/60 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-blue-900 font-semibold mb-1">
                <ShieldAlert className="w-4 h-4" />
                <span>隐私安全</span>
              </div>
              <p className="text-xs text-blue-700">
                API Key 是您的私有凭证，请勿截图分享或上传到公开代码仓库。
              </p>
            </div>
          </div>

          <div className="mt-6">
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-lg transition-colors shadow-sm"
            >
              获取 API Key <ExternalLink className="w-4 h-4" />
            </a>
            <p className="text-xs text-blue-500 mt-2">点击前往 Google AI Studio 申请</p>
          </div>
        </div>

      </div>
    </div>
  );
};