import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function MarketForecastChart() {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showChart, setShowChart] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [useExample, setUseExample] = useState(false); // 例モード判定
  const [displayMarket, setDisplayMarket] = useState(''); // タイトルバー表示用の市場名

  // 例データ入力のための定数
  const EXAMPLE_FORM = {
    company: 'ダイアナ',
    service: '靴',
    market: '婦人靴'
  };
  const EXAMPLE_DELAY_MS = 20000; // 約20秒待機

  // フォーム入力の状態
  const [formData, setFormData] = useState({
    company: '',
    service: '',
    market: ''
  });

  // サンプルJSON（スライド生成に使用）
  const sampleJson = {
    "2019": 1200,
    "2020": 1150,
    "2021": 1180,
    "2022": 1220,
    "2023": 1250,
    "2024": 1280,
    "2025": 1310,
    "2026": 1340,
    "2027": 1375,
    "y-axis_units": "億円",
    "market_predict_summary": "婦人靴市場は2023年の1,250億円から、2027年には1,375億円へと成長が見込まれており、安定した成長が期待される",
    "market_summary": "国内婦人靴市場は、EC化の進展と高付加価値商品の需要増により堅調に推移しています。特に機能性とファッション性を両立した商品カテゴリーが市場を牽引しています。",
    "source_url": ["https://www.yano.co.jp/press-release/show/press_id/3645", "https://pando.life/article/1813796"]
  };

  // フォーム入力の処理
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // 入力が変更されたら例モードはオフ
    if (useExample) setUseExample(false);
  };

  // JSONテストモードでの処理
  const handleTestSubmit = () => {
    try {
      if (!jsonInput.trim()) {
        setError('JSONデータを入力してください。');
        return;
      }
      const parsedData = JSON.parse(jsonInput);
      setMarketData(parsedData);
      // 現在のフォームに入力されている市場名をタイトルバーに反映
      setDisplayMarket(formData.market || '');
      setShowChart(true);
      setError(null);
    } catch (err) {
      setError('無効なJSON形式です。正しいJSON形式で入力してください。');
    }
  };

  // 例ボタン: 入力フォームに例（ダイアナ）を自動入力
  const fillExample = () => {
    setFormData(EXAMPLE_FORM);
    setUseExample(true);
    setError(null);
  };

  // フォーム送信の処理（通常APIモード）
  const handleSubmit = async () => {
    if (!formData.company || !formData.service || !formData.market) {
      setError('すべての項目を入力してください。');
      return;
    }

    setLoading(true);
    setError(null);
    setShowChart(false);

    // 提出時点の市場名をタイトルバー用に固定
    setDisplayMarket(formData.market);

    // 例モードのときはAPIを呼ばず、20秒待ってからサンプルJSONでスライド生成
    if (useExample) {
      try {
        await new Promise((resolve) => setTimeout(resolve, EXAMPLE_DELAY_MS));
        setMarketData(sampleJson);
        setShowChart(true);
      } catch (e) {
        setError('生成中に問題が発生しました。');
      } finally {
        setLoading(false);
      }
      return;
    }

    // 通常のAPIコール
    try {
      const response = await fetch('https://satyr-teaching-ghastly.ngrok-free.app/api/search_market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: formData.company,
          service: formData.service,
          market: formData.market
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMarketData(data);
      setShowChart(true);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // リセット処理
  const handleReset = () => {
    setFormData({ company: '', service: '', market: '' });
    setMarketData(null);
    setShowChart(false);
    setError(null);
    setJsonInput('');
    setUseExample(false);
    setDisplayMarket('');
  };

  // サンプルJSONを挿入（テストモード）
  const insertSampleJson = () => {
    setJsonInput(JSON.stringify(sampleJson, null, 2));
  };

  // グラフデータの準備
  const prepareChartData = () => {
    if (!marketData) return [];
    const years = Object.keys(marketData).filter((key) => /^\d{4}$/.test(key)).sort();
    const actualYearIndex = years.indexOf('2023');
    return years.map((year, index) => ({
      year,
      actual: index <= actualYearIndex ? marketData[year] : null,
      forecast: index > actualYearIndex ? marketData[year] : null
    }));
  };

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const units = marketData?.['y-axis_units'] || '億円';
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow-lg">
          <p className="font-semibold">{`${label}年`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.dataKey === 'actual' ? '実績' : '予測'}: ${entry.value?.toLocaleString()} ${units}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const slideContainerStyle = {
    width: '100%',
    maxWidth: '1280px',
    margin: '20px auto',
    aspectRatio: '16 / 9',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    border: '1px solid #d0d0d0',
    overflow: 'hidden',
    fontFamily: "'Yu Gothic UI', 'YuGothic', 'Meiryo', 'Noto Sans JP', 'Inter', sans-serif"
  };

  const slideHeaderStyle = {
    padding: '20px 40px',
    borderBottom: '3px solid #E50914',
    textAlign: 'center',
    flexShrink: 0,
    backgroundColor: '#f8f9fa'
  };

  const slideContentStyle = {
    flexGrow: 1,
    padding: '25px 35px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflowY: 'auto'
  };

  const summaryTextStyle = {
    fontSize: '1.3rem',
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    lineHeight: '1.7',
    maxWidth: '800px',
    marginBottom: '20px'
  };
  // 共通: グラフとタイトルバーの横幅
  const CONTENT_WIDTH = '85%';
  const CONTENT_MAX_WIDTH = '980px';

  // ★ 追加: グラフ上部の黒帯タイトルバー
  const miniTitleBarStyle = {
    width: CONTENT_WIDTH,
    maxWidth: CONTENT_MAX_WIDTH,
    backgroundColor: '#111111',
    color: '#ffffff',
    textAlign: 'center',
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: 700,
    letterSpacing: '0.03em',
    marginBottom: '12px'
  };

  const sourceTextStyle = {
    position: 'absolute',
    bottom: '15px',
    right: '35px',
    fontSize: '0.75rem',
    color: '#777777'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0f2f5' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {useExample ? 'データを生成中...' : 'データを読み込んでいます...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: '#f0f2f5' }}>
      <div style={slideContainerStyle}>
        <div style={slideHeaderStyle}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '700', color: '#000000', margin: 0 }}>
            {showChart ? '市場規模の推移と将来予測' : '市場予測分析システム'}
          </h1>
        </div>

        <div style={slideContentStyle}>
          {!showChart ? (
            // 入力フォーム
            <>

              {!testMode ? (
                // 通常モード
                <div className="w-full max-w-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">会社名</label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                        style={{ '--tw-ring-color': '#E50914' }}
                        placeholder="例: ダイアナ"
                      />
                    </div>
                    <div>
                      <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">サービス・商品</label>
                      <input
                        type="text"
                        id="service"
                        name="service"
                        value={formData.service}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                        style={{ '--tw-ring-color': '#E50914' }}
                        placeholder="例: 靴"
                      />
                    </div>
                    <div>
                      <label htmlFor="market" className="block text-sm font-medium text-gray-700 mb-1">市場</label>
                      <input
                        type="text"
                        id="market"
                        name="market"
                        value={formData.market}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                        style={{ '--tw-ring-color': '#E50914' }}
                        placeholder="例: 婦人靴"
                      />
                    </div>
                  </div>

                  {/* 例ボタン行 */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-sm text-gray-600">
                      {useExample ? '例（ダイアナ）が入力されています。' : '必要事項を入力するか、右の「例を入力」を押してください。'}
                    </div>
                    <div className="flex gap-2">
                      {useExample && (
                        <button
                          onClick={() => setUseExample(false)}
                          className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                          disabled={loading}
                        >
                          例モード解除
                        </button>
                      )}
                      <button
                        onClick={fillExample}
                        className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                        disabled={loading}
                      >
                        例を入力
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">{error}</div>
                  )}

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={handleSubmit}
                      className="px-6 py-2 text-white font-medium rounded-md transition-colors disabled:bg-gray-400"
                      style={{ backgroundColor: '#E50914' }}
                      onMouseEnter={(e) => (e.target.style.backgroundColor = '#b8070f')}
                      onMouseLeave={(e) => (e.target.style.backgroundColor = '#E50914')}
                      disabled={loading}
                    >
                      分析開始
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-6 py-2 bg-gray-500 text-white font-medium rounded-md hover:bg-gray-600 transition-colors disabled:bg-gray-300"
                      disabled={loading}
                    >
                      リセット
                    </button>
                  </div>
                </div>
              ) : (
                // テストモード
                <div className="w-full max-w-3xl">
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">JSONデータ入力</label>
                      <button
                        onClick={insertSampleJson}
                        className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        サンプルJSON挿入
                      </button>
                    </div>
                    <textarea
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      className="w-full h-48 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': '#E50914' }}
                      placeholder={`JSONデータを入力してください。例：\n{\n  "2019": 1200,\n  "2020": 1150,\n  "2021": 1180,\n  "2022": 1220,\n  "2023": 1250,\n  "2024": 1280,\n  "2025": 1310,\n  "y-axis_units": "億円",\n  "market_predict_summary": "市場予測の要約",\n  "market_summary": "市場の概要",\n  "source_url": ["https://example.com"]\n}`}
                    />
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">{error}</div>
                  )}

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={handleTestSubmit}
                      className="px-6 py-2 text-white font-medium rounded-md transition-colors"
                      style={{ backgroundColor: '#E50914' }}
                      onMouseEnter={(e) => (e.target.style.backgroundColor = '#b8070f')}
                      onMouseLeave={(e) => (e.target.style.backgroundColor = '#E50914')}
                    >
                      グラフ表示
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-6 py-2 bg-gray-500 text-white font-medium rounded-md hover:bg-gray-600 transition-colors"
                    >
                      リセット
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            // チャート表示
            <>
              {marketData?.market_predict_summary && <p style={summaryTextStyle}>{marketData.market_predict_summary}</p>}

              {/* ★ 追加: 黒帯タイトルバー（例: 「婦人靴の市場規模」） */}
              <div style={miniTitleBarStyle}>
                {(displayMarket || formData.market) ? `${displayMarket || formData.market}の市場規模` : '市場規模'}
              </div>

              <div style={{ position: 'relative', width: CONTENT_WIDTH, maxWidth: CONTENT_MAX_WIDTH, margin: '0 auto', height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prepareChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis
                      tickFormatter={(value) => (value != null ? value.toLocaleString() : '')}
                      label={{
                        value: `市場規模（${marketData?.['y-axis_units'] || '億円'}）`,
                        angle: -90,
                        position: 'insideLeft'
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="actual" fill="rgba(229, 9, 20, 0.8)" name="市場規模（実績）" />
                    <Bar dataKey="forecast" fill="rgba(229, 9, 20, 0.4)" name="市場規模（予測）" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {marketData?.source_url && marketData.source_url.length > 0 && (
                <p style={sourceTextStyle}>
                  出典:{' '}
                  {marketData.source_url.map((url, index) => (
                    <span key={index}>{index > 0 && ', '}{url}</span>
                  ))}
                </p>
              )}

            </>
          )}
        </div>
      </div>

      {/* 市場サマリー情報（チャート表示時のみ、スライド外に表示） */}
      {showChart && marketData?.market_summary && (
        <div className="max-w-6xl mx-auto px-4 mt-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">市場概況</h3>
            <p className="text-gray-700 leading-relaxed">{marketData.market_summary}</p>
            {marketData['y-axis_units'] && (
              <p className="mt-3 text-sm text-gray-500">※ 数値の単位: {marketData['y-axis_units']}</p>
            )}
          </div>
              <button
                onClick={handleReset}
                className="mt-4 px-6 py-2 bg-gray-500 text-white font-medium rounded-md hover:bg-gray-600 transition-colors"
              >
                リセット
              </button>
        </div>
      )}
    </div>
  );
}
