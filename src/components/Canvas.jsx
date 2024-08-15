import React, { useRef, useEffect, useState } from 'react';

const Canvas = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);
  const [tool, setTool] = useState('pencil');
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [text, setText] = useState('');
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [color, setColor] = useState('black');
  const [lineWidth, setLineWidth] = useState(2);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.font = '20px Arial';
    setContext(ctx);

    const resizeCanvas = () => {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      tempCtx.drawImage(canvas, 0, 0);

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 50;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.font = '20px Arial';
      ctx.drawImage(tempCanvas, 0, 0);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  useEffect(() => {
    if (context) {
      context.strokeStyle = color;
      context.lineWidth = lineWidth;
    }
  }, [context, color, lineWidth]);

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
      context.beginPath();
      context.moveTo(offsetX, offsetY);
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;

    if (tool === 'pencil' || tool === 'eraser') {
      context.lineTo(offsetX, offsetY);
      context.stroke();
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
    }
  };

  const setToolAndOptions = (newTool) => {
    setTool(newTool);
    if (newTool === 'eraser') {
      setColor('white');
      setLineWidth(20);
    } else {
      setColor('black');
      setLineWidth(2);
    }
    setIsTyping(false);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', padding: '0 10px' }}>
        <button onClick={() => setToolAndOptions('pencil')}>Pencil</button>
        <button onClick={() => setToolAndOptions('line')}>Line</button>
        <button onClick={() => setToolAndOptions('rectangle')}>Rectangle</button>
        <button onClick={() => setToolAndOptions('circle')}>Circle</button>
        <button onClick={() => setToolAndOptions('text')}>Text</button>
        <button onClick={() => setToolAndOptions('eraser')}>Eraser</button>
      </div>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: '50px', left: 0, right: 0, bottom: 0 }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
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