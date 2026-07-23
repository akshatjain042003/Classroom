# Eraser Algorithm Explanation

## Problem Statement
When a user draws strokes and then erases parts of them, we want to save **only the visible strokes** to the backend, not the eraser strokes themselves.

## Solution Overview
The algorithm processes all local strokes before saving, splits drawing strokes at eraser intersections, and removes erased segments.

---

## Algorithm Steps

### Step 1: Separate Strokes
```typescript
const drawingStrokes = strokes.filter(s => !s.isEraser);
const eraserStrokes = strokes.filter(s => s.isEraser);
```
- **Drawing strokes:** User's pen drawings (colored lines)
- **Eraser strokes:** Paths where user dragged the eraser (background-colored)

---

### Step 2: Process Each Drawing Stroke

For each drawing stroke, we check which points are erased:

```typescript
drawingStroke.points.forEach(point => {
  // Check if this point is within any eraser path
  for (const eraserStroke of eraserStrokes) {
    if (isPointWithinEraserPath(point, eraserStroke)) {
      // Mark point as erased
    }
  }
});
```

---

### Step 3: Point-to-Eraser Distance Check

```typescript
isPointWithinEraserPath(point, eraserStroke) {
  const eraserRadius = eraserStroke.thickness / 2;
  
  // Check distance to each segment of the eraser path
  for each line segment in eraserStroke {
    distance = distanceToLineSegment(point, segmentStart, segmentEnd);
    if (distance <= eraserRadius) {
      return true; // Point is erased
    }
  }
  return false; // Point is visible
}
```

**Visual Example:**
```
Drawing Point: •
Eraser Path: ========
Eraser Radius: |--r--|

If distance(•, eraser path) <= r → Point is ERASED
If distance(•, eraser path) > r  → Point is VISIBLE
```

---

### Step 4: Split Stroke into Segments

After marking points as erased/visible, group consecutive visible points:

```
Original Stroke: A-B-C-D-E-F-G-H-I-J
Point Status:    ✓ ✓ ✗ ✗ ✗ ✓ ✓ ✓ ✗ ✓
                 [Seg1] [Erased] [Segment 2] [E] [S3]

Result: 
- Segment 1: [A, B] (2 points - saved)
- Segment 2: [F, G, H] (3 points - saved)
- Segment 3: [J] (1 point - discarded, need min 2 points)
```

**Code:**
```typescript
let currentSegment = [];

pointStatus.forEach(({ point, isErased }) => {
  if (!isErased) {
    currentSegment.push(point);
  } else {
    // Save current segment if it has >= 2 points
    if (currentSegment.length >= 2) {
      segments.push(createStroke(currentSegment));
    }
    currentSegment = []; // Start new segment
  }
});
```

---

### Step 5: Distance to Line Segment Calculation

This is the core geometric function:

```typescript
distanceToLineSegment(point, lineStart, lineEnd) {
  // Vector from lineStart to point
  A = point.x - lineStart.x
  B = point.y - lineStart.y
  
  // Vector from lineStart to lineEnd
  C = lineEnd.x - lineStart.x
  D = lineEnd.y - lineStart.y
  
  // Project point onto line
  dot = A * C + B * D
  lenSq = C * C + D * D
  param = dot / lenSq
  
  // Find closest point on line segment
  if (param < 0) {
    closestPoint = lineStart
  } else if (param > 1) {
    closestPoint = lineEnd
  } else {
    closestPoint = lineStart + param * (lineEnd - lineStart)
  }
  
  // Calculate distance
  return distance(point, closestPoint)
}
```

**Visual:**
```
        • P (point)
       /|
      / |
     /  | distance
    /   |
   /    |
  A-----•-----B
      closest
      
If closest is between A and B: use perpendicular distance
If closest is before A: use distance to A
If closest is after B: use distance to B
```

---

## Complete Flow Example

### Initial State:
```
Drawing Stroke 1: ━━━━━━━━━━━━━━━━ (blue line)
Drawing Stroke 2: ════════════════ (red line)
```

### User Erases:
```
Drawing Stroke 1: ━━━━━━━━━━━━━━━━
Eraser Path:          ╳╳╳╳╳╳
Drawing Stroke 2: ════════════════
```

### Processing:
```
Stroke 1 Analysis:
Points: [p1, p2, p3, p4, p5, p6, p7, p8]
Status: [✓,  ✓,  ✗,  ✗,  ✗,  ✓,  ✓,  ✓]

Result: 
- Segment A: [p1, p2] (visible)
- Segment B: [p6, p7, p8] (visible)

Stroke 2: Not affected by eraser
Result: [entire stroke]
```

### Saved to Backend:
```json
{
  "strokes": [
    {
      "points": [p1, p2],
      "color": "blue",
      "thickness": 2
    },
    {
      "points": [p6, p7, p8],
      "color": "blue",
      "thickness": 2
    },
    {
      "points": [entire stroke 2],
      "color": "red",
      "thickness": 2
    }
  ]
}
```

**Note:** Eraser strokes are NOT saved!

---

## Benefits of This Approach

✅ **Clean Backend Data:** Only visible strokes are saved
✅ **No Eraser Strokes:** Backend doesn't need to handle eraser logic
✅ **Accurate Representation:** What you see is what you save
✅ **Efficient Storage:** No redundant data (no overlapping strokes)
✅ **True Erasing:** Strokes are actually split/removed, not just covered

---

## Edge Cases Handled

1. **Entire Stroke Erased:** Returns empty array (nothing to save)
2. **Partial Erase:** Returns multiple segments
3. **No Overlap:** Returns original stroke unchanged
4. **Single Point Remaining:** Discarded (need min 2 points for a line)
5. **Multiple Eraser Passes:** All eraser paths are checked against each point

---

## Performance Considerations

- **Time Complexity:** O(D × E × P)
  - D = number of drawing strokes
  - E = number of eraser strokes
  - P = average points per stroke

- **Optimization:** For large whiteboards, could use spatial indexing (quadtree) to reduce checks

---

## Visual Summary

```
┌─────────────────────────────────────────┐
│  User draws and erases locally          │
│  (all changes in memory)                │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Click "Save All"                       │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  processEraserEffects()                 │
│  ├─ Separate drawing & eraser strokes   │
│  ├─ For each drawing stroke:            │
│  │  ├─ Check each point vs erasers      │
│  │  ├─ Mark as erased/visible           │
│  │  └─ Split into segments               │
│  └─ Return only visible segments        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Send to Backend                        │
│  POST /whiteboard/:id/stroke/bulk       │
│  { strokes: [visible segments only] }   │
└─────────────────────────────────────────┘
```

This approach gives you exactly what you asked for: **only the strokes that are visible on screen are saved to the backend!** 🎨
