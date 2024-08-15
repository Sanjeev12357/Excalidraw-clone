import React, { useRef, useEffect, useState } from 'react';

const Canvas = () => {
  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null); // Ref for the preview canvas
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);
  const [previewContext, setPreviewContext] = useState(null); // Context for the preview canvas
  const [tool, setTool] = useState('pencil');
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [text, setText] = useState('');
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [color, setColor] = useState('white');
  const [lineWidth, setLineWidth] = useState(2);
  const [isTyping, setIsTyping] = useState(false);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const previewCtx = previewCanvas.getContext('2d');
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.font = '20px Arial';
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    previewCtx.lineCap = 'round';
    previewCtx.lineJoin = 'round';
    previewCtx.font = '20px Arial';

    setContext(ctx);
    setPreviewContext(previewCtx);

    const resizeCanvas = () => {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      tempCtx.drawImage(canvas, 0, 0);

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 50;
      previewCanvas.width = canvas.width;
      previewCanvas.height = canvas.height;
      
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.font = '20px Arial';
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempCanvas, 0, 0);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  useEffect(() => {
    if (context && previewContext) {
      context.strokeStyle = color;
      context.lineWidth = lineWidth;
      previewContext.strokeStyle = color;
      previewContext.lineWidth = lineWidth;
    }
  }, [context, previewContext, color, lineWidth]);

  const startDrawing = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    setStartX(offsetX);
    setStartY(offsetY);

    if (tool === 'text') {
      setTextPosition({ x: offsetX, y: offsetY });
      setIsTyping(true);
      setText('');
    } else {
      setIsDrawing(true);
      if (tool === 'pencil' || tool === 'eraser') {
        context.beginPath();
        context.moveTo(offsetX, offsetY);
      }
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;

    if (tool === 'pencil' || tool === 'eraser') {
      context.lineTo(offsetX, offsetY);
      context.stroke();
    } else {
      // Clear the preview canvas before drawing the next shape preview
      previewContext.clearRect(0, 0, previewCanvasRef.current.width, previewCanvasRef.current.height);
      
      if (tool === 'line') {
        previewContext.beginPath();
        previewContext.moveTo(startX, startY);
        previewContext.lineTo(offsetX, offsetY);
        previewContext.stroke();
      } else if (tool === 'rectangle') {
        previewContext.strokeRect(startX, startY, offsetX - startX, offsetY - startY);
      } else if (tool === 'circle') {
        const radius = Math.sqrt(Math.pow(offsetX - startX, 2) + Math.pow(offsetY - startY, 2));
        previewContext.beginPath();
        previewContext.arc(startX, startY, radius, 0, 2 * Math.PI);
        previewContext.stroke();
      }
    }
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;

    if (tool === 'line') {
      context.beginPath();
      context.moveTo(startX, startY);
      context.lineTo(offsetX, offsetY);
      context.stroke();
    } else if (tool === 'rectangle') {
      context.strokeRect(startX, startY, offsetX - startX, offsetY - startY);
    } else if (tool === 'circle') {
      const radius = Math.sqrt(Math.pow(offsetX - startX, 2) + Math.pow(offsetY - startY, 2));
      context.beginPath();
      context.arc(startX, startY, radius, 0, 2 * Math.PI);
      context.stroke();
    }

    context.closePath();
    setIsDrawing(false);

    // Clear the preview canvas
    previewContext.clearRect(0, 0, previewCanvasRef.current.width, previewCanvasRef.current.height);

    saveState();
  };

  const saveState = () => {
    const canvas = canvasRef.current;
    const newHistory = [...history, canvas.toDataURL()];
    setHistory(newHistory);
    setRedoStack([]); // Clear the redo stack on new action
  };

  const undo = () => {
    if (history.length > 0) {
      const newRedoStack = [...redoStack, history.pop()];
      setRedoStack(newRedoStack);
      setHistory([...history]);
      restoreState(history[history.length - 1]);
    }
  };

  const redo = () => {
    if (redoStack.length > 0) {
      const restoredState = redoStack.pop();
      setHistory([...history, restoredState]);
      setRedoStack([...redoStack]);
      restoreState(restoredState);
    }
  };

  const restoreState = (dataUrl) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  };

  const handleTextInput = (e) => {
    setText(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      context.fillStyle = color;
      context.fillText(text, textPosition.x, textPosition.y);
      setIsTyping(false);
      setText('');
      saveState(); // Save state after adding text
    }
  };

  const setToolAndOptions = (newTool) => {
    setTool(newTool);
    if (newTool === 'eraser') {
      setColor('black');
      setLineWidth(20);
    } else {
      setColor('white');
      setLineWidth(2);
    }
    setIsTyping(false);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50px',
          backgroundColor: '#000',
          display: 'flex',
          alignItems: 'center',
          padding: '0 10px',
        }}
      >
        <button
          onClick={() => setToolAndOptions('pencil')}
          style={{
            backgroundColor: '#000',
            color: '#fff',
            border: '1px solid #fff',
            padding: '5px 10px',
            marginRight: '5px',
            cursor: 'pointer',
          }}
        >
          Pencil
        </button>
        <button
          onClick={() => setToolAndOptions('line')}
          style={{
            backgroundColor: '#000',
            color: '#fff',
            border: '1px solid #fff',
            padding: '5px 10px',
            marginRight: '5px',
            cursor: 'pointer',
          }}
        >
          Line
        </button>
        <button
          onClick={() => setToolAndOptions('rectangle')}
          style={{
            backgroundColor: '#000',
            color: '#fff',
            border: '1px solid #fff',
            padding: '5px 10px',
            marginRight: '5px',
            cursor: 'pointer',
          }}
        >
          Rectangle
        </button>
        <button
          onClick={() => setToolAndOptions('circle')}
          style={{
            backgroundColor: '#000',
            color: '#fff',
            border: '1px solid #fff',
            padding: '5px 10px',
            marginRight: '5px',
            cursor: 'pointer',
          }}
        >
          Circle
        </button>
        <button
          onClick={() => setToolAndOptions('text')}
          style={{
            backgroundColor: '#000',
            color: '#fff',
            border: '1px solid #fff',
            padding: '5px 10px',
            marginRight: '5px',
            cursor: 'pointer',
          }}
        >
          Text
        </button>
        <button
          onClick={() => setToolAndOptions('eraser')}
          style={{
            backgroundColor: '#000',
            color: '#fff',
            border: '1px solid #fff',
            padding: '5px 10px',
            marginRight: '5px',
            cursor: 'pointer',
          }}
        >
          Eraser
        </button>
        <button
          onClick={undo}
          style={{
            backgroundColor: '#000',
            color: '#fff',
            border: '1px solid #fff',
            padding: '5px 10px',
            marginRight: '5px',
            cursor: 'pointer',
          }}
        >
          Undo
        </button>
        <button
          onClick={redo}
          style={{
            backgroundColor: '#000',
            color: '#fff',
            border: '1px solid #fff',
            padding: '5px 10px',
            cursor: 'pointer',
          }}
        >
          Redo
        </button>
      </div>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: '50px',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'black',
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
      />
      <canvas
        ref={previewCanvasRef} // Reference to the preview canvas
        style={{
          position: 'absolute',
          top: '50px',
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none', // This makes sure the preview canvas does not capture mouse events
        }}
      />
      {isTyping && (
        <input
          type="text"
          value={text}
          onChange={handleTextInput}
          onKeyDown={handleKeyDown}
          placeholder="Type and press Enter"
          style={{
            position: 'absolute',
            left: `${textPosition.x}px`,
            top: `${textPosition.y + 50}px`,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: color,
          }}
          autoFocus
        />
      )}
    </div>
  );
};

export default Canvas;
