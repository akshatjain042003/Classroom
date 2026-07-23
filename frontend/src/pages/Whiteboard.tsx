import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { WhiteboardData, Point, Stroke } from '../types/user';

interface LocalStroke extends Stroke {
  id: string; // Temporary ID for local tracking
  isEraser?: boolean; // Flag to mark eraser strokes
}

const Whiteboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [whiteboard, setWhiteboard] = useState<WhiteboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Stroke management
  const [savedStrokes, setSavedStrokes] = useState<Stroke[]>([]);
  const [localStrokes, setLocalStrokes] = useState<LocalStroke[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [currentEraserPath, setCurrentEraserPath] = useState<Point[]>([]);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedThickness, setSelectedThickness] = useState(2);
  const [eraserThickness, setEraserThickness] = useState(20);
  const [isSaving, setIsSaving] = useState(false);
  
  // Tool state
  const [eraserMode, setEraserMode] = useState(false);

  useEffect(() => {
    fetchWhiteboard();
  }, [id]);

  useEffect(() => {
    if (whiteboard && canvasRef.current) {
      drawWhiteboard();
    }
  }, [whiteboard, savedStrokes, localStrokes]);

  const fetchWhiteboard = async () => {
    try {
      const response = await api.get<WhiteboardData>(`/whiteboard/${id}`);
      setWhiteboard(response.data);
      setSavedStrokes(response.data.stroke || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load whiteboard');
    } finally {
      setLoading(false);
    }
  };

  const drawWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas || !whiteboard) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set background color
    ctx.fillStyle = whiteboard.backgroundcolor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all strokes (saved + local) in order
    const allStrokes = [...savedStrokes, ...localStrokes];
    
    allStrokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;

      const localStroke = stroke as LocalStroke;
      
      // All strokes use source-over, but eraser strokes use background color
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.thickness;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }

      ctx.stroke();
    });

    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const isPointNearStroke = (point: Point, stroke: Stroke, threshold: number = 10): boolean => {
    for (let i = 0; i < stroke.points.length - 1; i++) {
      const p1 = stroke.points[i];
      const p2 = stroke.points[i + 1];
      
      const distance = distanceToLineSegment(point, p1, p2);
      if (distance <= threshold) {
        return true;
      }
    }
    return false;
  };

  const distanceToLineSegment = (point: Point, lineStart: Point, lineEnd: Point): number => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    setIsDrawing(true);

    if (eraserMode) {
      // Start eraser path - use background color
      setCurrentEraserPath([pos]);
      
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && whiteboard) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.beginPath();
        ctx.strokeStyle = whiteboard.backgroundcolor; // Use background color
        ctx.lineWidth = eraserThickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(pos.x, pos.y);
      }
    } else {
      // Start drawing path
      setCurrentStroke([pos]);
      
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.beginPath();
        ctx.strokeStyle = selectedColor;
        ctx.lineWidth = selectedThickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(pos.x, pos.y);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const pos = getMousePos(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (eraserMode) {
      // Continue eraser path
      setCurrentEraserPath((prev) => [...prev, pos]);
      
      if (ctx) {
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
    } else {
      // Continue drawing path
      setCurrentStroke((prev) => [...prev, pos]);
      
      if (ctx) {
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.globalCompositeOperation = 'source-over';
    }

    if (eraserMode) {
      // Save eraser path as a special stroke
      if (currentEraserPath.length < 2) {
        setCurrentEraserPath([]);
        return;
      }

      const eraserStroke: LocalStroke = {
        id: `eraser-${Date.now()}-${Math.random()}`,
        points: currentEraserPath,
        color: whiteboard?.backgroundcolor || '#ffffff', // Use background color
        thickness: eraserThickness,
        isEraser: true,
      };

      setLocalStrokes(prev => [...prev, eraserStroke]);
      setCurrentEraserPath([]);
      setHasUnsavedChanges(true);
    } else {
      // Save drawing stroke
      if (currentStroke.length < 2) {
        setCurrentStroke([]);
        return;
      }

      const newStroke: LocalStroke = {
        id: `local-${Date.now()}-${Math.random()}`,
        points: currentStroke,
        color: selectedColor,
        thickness: selectedThickness,
        isEraser: false,
      };

      setLocalStrokes(prev => [...prev, newStroke]);
      setCurrentStroke([]);
      setHasUnsavedChanges(true);
    }
  };

  const handleSaveAll = async () => {
    if (localStrokes.length === 0) {
      setError('No new strokes to save');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      // Process strokes: apply eraser effects and get only visible strokes
      const visibleStrokes = processEraserEffects(localStrokes);
      
      if (visibleStrokes.length === 0) {
        setError('No visible strokes to save (everything was erased)');
        setTimeout(() => setError(''), 3000);
        setIsSaving(false);
        return;
      }

      // Prepare strokes for backend (remove temporary id and isEraser flag)
      const strokesToSave = visibleStrokes.map(({ id, isEraser, ...stroke }) => ({
        ...stroke,
        opacity: 0.99,
      }));

      await api.post(`/whiteboard/${id}/stroke/bulk`, {
        strokes: strokesToSave,
      });

      // Move visible strokes to saved strokes
      setSavedStrokes(prev => [...prev, ...visibleStrokes]);
      setLocalStrokes([]);
      setHasUnsavedChanges(false);

      // Refresh to get server data
      await fetchWhiteboard();
    } catch (err: any) {
      console.error('Failed to save strokes:', err);
      setError('Failed to save drawings. Please try again.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const processEraserEffects = (strokes: LocalStroke[]): LocalStroke[] => {
    // Separate drawing strokes and eraser strokes
    const drawingStrokes = strokes.filter(s => !s.isEraser);
    const eraserStrokes = strokes.filter(s => s.isEraser);

    if (eraserStrokes.length === 0) {
      // No eraser strokes, return all drawing strokes
      return drawingStrokes;
    }

    const resultStrokes: LocalStroke[] = [];

    // Process each drawing stroke
    drawingStrokes.forEach(drawingStroke => {
      // Check which points are NOT erased
      const segments = splitStrokeByErasers(drawingStroke, eraserStrokes);
      resultStrokes.push(...segments);
    });

    return resultStrokes;
  };

  const splitStrokeByErasers = (
    drawingStroke: LocalStroke,
    eraserStrokes: LocalStroke[]
  ): LocalStroke[] => {
    // Mark each point as erased or not
    const pointStatus = drawingStroke.points.map(point => {
      let isErased = false;
      
      // Check if this point is within any eraser stroke
      for (const eraserStroke of eraserStrokes) {
        if (isPointWithinEraserPath(point, eraserStroke)) {
          isErased = true;
          break;
        }
      }
      
      return { point, isErased };
    });

    // Group consecutive non-erased points into segments
    const segments: LocalStroke[] = [];
    let currentSegment: Point[] = [];

    pointStatus.forEach(({ point, isErased }) => {
      if (!isErased) {
        currentSegment.push(point);
      } else {
        // Point is erased, save current segment if it has enough points
        if (currentSegment.length >= 2) {
          segments.push({
            id: `segment-${Date.now()}-${Math.random()}`,
            points: currentSegment,
            color: drawingStroke.color,
            thickness: drawingStroke.thickness,
            isEraser: false,
          });
        }
        currentSegment = [];
      }
    });

    // Don't forget the last segment
    if (currentSegment.length >= 2) {
      segments.push({
        id: `segment-${Date.now()}-${Math.random()}`,
        points: currentSegment,
        color: drawingStroke.color,
        thickness: drawingStroke.thickness,
        isEraser: false,
      });
    }

    return segments;
  };

  const isPointWithinEraserPath = (point: Point, eraserStroke: LocalStroke): boolean => {
    const eraserRadius = eraserStroke.thickness / 2;

    // Check if point is within eraser radius of any point in the eraser path
    for (let i = 0; i < eraserStroke.points.length - 1; i++) {
      const p1 = eraserStroke.points[i];
      const p2 = eraserStroke.points[i + 1];
      
      const distance = distanceToLineSegment(point, p1, p2);
      if (distance <= eraserRadius) {
        return true;
      }
    }

    return false;
  };

  const handleDiscardChanges = () => {
    if (window.confirm('Are you sure you want to discard all unsaved changes?')) {
      setLocalStrokes([]);
      setHasUnsavedChanges(false);
      drawWhiteboard();
    }
  };

  const clearCanvas = () => {
    if (window.confirm('Clear all local strokes? (Saved strokes will remain)')) {
      setLocalStrokes([]);
      setHasUnsavedChanges(localStrokes.length > 0);
      drawWhiteboard();
    }
  };

  const toggleEraser = () => {
    setEraserMode(!eraserMode);
  };

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading whiteboard...</p>
        </div>
      </div>
    );
  }

  if (error && !whiteboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌</div>
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-800 transition"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-800">
                {whiteboard?.title}
              </h1>
              {hasUnsavedChanges && (
                <span className="text-sm text-orange-600 font-medium">
                  ⚠️ Unsaved changes ({localStrokes.length} strokes)
                </span>
              )}
              {isSaving && (
                <span className="text-sm text-blue-600 animate-pulse">Saving...</span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Created by: {whiteboard?.userid.firstname}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Drawing Tools */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-6">
              {/* Tool Selection */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEraserMode(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    !eraserMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  ✏️ Pen
                </button>
                <button
                  onClick={toggleEraser}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    eraserMode
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  🧹 Eraser
                </button>
              </div>

              {/* Color Picker - Only show in pen mode */}
              {!eraserMode && (
                <>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Color:</label>
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer border-2 border-gray-300"
                    />
                    <span className="text-sm text-gray-600">{selectedColor}</span>
                  </div>

                  {/* Thickness Slider */}
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Thickness:</label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={selectedThickness}
                      onChange={(e) => setSelectedThickness(Number(e.target.value))}
                      className="w-32"
                    />
                    <span className="text-sm text-gray-600 w-8">{selectedThickness}px</span>
                  </div>

                  {/* Preview */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Preview:</span>
                    <div
                      className="rounded-full"
                      style={{
                        width: `${selectedThickness + 10}px`,
                        height: `${selectedThickness + 10}px`,
                        backgroundColor: selectedColor,
                        border: '2px solid #e5e7eb',
                      }}
                    />
                  </div>
                </>
              )}

              {/* Eraser Size - Only show in eraser mode */}
              {eraserMode && (
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Eraser Size:</label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={eraserThickness}
                    onChange={(e) => setEraserThickness(Number(e.target.value))}
                    className="w-32"
                  />
                  <span className="text-sm text-gray-600 w-8">{eraserThickness}px</span>
                  <div
                    className="rounded-full bg-gray-300"
                    style={{
                      width: `${Math.min(eraserThickness, 30)}px`,
                      height: `${Math.min(eraserThickness, 30)}px`,
                      backgroundColor: whiteboard?.backgroundcolor || '#ffffff',
                      border: '2px solid #9ca3af',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={clearCanvas}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition text-sm font-medium"
              >
                Clear Local
              </button>
              {hasUnsavedChanges && (
                <>
                  <button
                    onClick={handleDiscardChanges}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm font-medium"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : `💾 Save All (${localStrokes.length})`}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && whiteboard && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Canvas Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-lg shadow-lg p-4">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`w-full border-2 border-gray-300 rounded ${
              eraserMode ? 'cursor-cell' : 'cursor-crosshair'
            }`}
            style={{ height: '600px' }}
          />
        </div>

        {/* Info Section */}
        <div className="mt-4 bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Whiteboard Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Saved Strokes:</span>
              <span className="ml-2 font-medium text-green-600">{savedStrokes.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Local Strokes:</span>
              <span className="ml-2 font-medium text-orange-600">{localStrokes.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Total:</span>
              <span className="ml-2 font-medium">{savedStrokes.length + localStrokes.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Background:</span>
              <span className="ml-2 font-medium">{whiteboard?.backgroundcolor}</span>
            </div>
            <div>
              <span className="text-gray-500">Owner:</span>
              <span className="ml-2 font-medium">{whiteboard?.userid.firstname}</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">📝 How to Use:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Pen Mode:</strong> Click and drag to draw strokes</li>
            <li>• <strong>Eraser Mode:</strong> Drag to erase by drawing with background color</li>
            <li>• <strong>Eraser Size:</strong> Adjust the eraser thickness to erase larger or smaller areas</li>
            <li>• <strong>Local Changes:</strong> All changes are kept in memory until you save</li>
            <li>• <strong>Save All:</strong> Saves all strokes including eraser strokes (as background-colored strokes)</li>
            <li>• <strong>Discard:</strong> Remove all unsaved changes and start fresh</li>
            <li>• <strong>Clear Local:</strong> Remove only local strokes (saved strokes remain)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;
