# How to Add Mixamo 3D Characters to EduPod

This guide explains how to download and integrate Mixamo 3D characters into the EduPod classroom.

## Step 1: Get Characters from Mixamo

1. Go to [mixamo.com](https://www.mixamo.com/) (free with Adobe account)
2. **Choose a Character**:
   - Click "Characters" tab
   - Select a teacher-like character (e.g., "Business Man", "Casual Woman")
   - Select a student-like character (e.g., "Young Adult", "Teenager")
3. **Add Animations**:
   - Click "Animations" tab
   - Search for and apply these animations:
     - `Idle` - default standing pose
     - `Talking` - gesturing while speaking
     - `Listening` - attentive pose
4. **Download Settings**:
   - Format: **FBX for Unity (.fbx)**
   - Pose: T-pose (for first download)
   - With Skin: Yes

## Step 2: Convert FBX to GLTF

Mixamo exports FBX, but web apps need GLTF/GLB format.

### Option A: Using Blender (Recommended)
```bash
# Install Blender from blender.org
```
1. Open Blender
2. File → Import → FBX
3. Select your Mixamo FBX file
4. File → Export → glTF 2.0 (.glb/.gltf)
5. Settings:
   - Format: glTF Binary (.glb)
   - Include: ✓ Animations
   - Animation Mode: Actions

### Option B: Online Converter
- [gltf.pmnd.rs](https://gltf.pmnd.rs/) - drag and drop FBX to convert

## Step 3: Add Models to EduPod

1. Place GLB files in:
   ```
   frontend/public/models/
   ├── teacher.glb
   └── student.glb
   ```

2. Update `Classroom3DAdvanced.tsx`:
   ```tsx
   <Classroom3DAdvanced
     activeSpeaker={activeSpeaker}
     isPlaying={isPlaying}
     teacherModelUrl="/models/teacher.glb"
     studentModelUrl="/models/student.glb"
   />
   ```

## Step 4: Verify

1. Restart dev server: `npm run dev`
2. Select "3D Mode" in the classroom
3. Characters should load with animations

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Model too big/small | Adjust `scale` prop (0.5 - 2.0) |
| Wrong orientation | Adjust `rotation` prop |
| No animations | Check GLB includes animations |
| Black model | Check model has materials embedded |

## Recommended Free Characters

Best Mixamo characters for classroom:

**Teachers:**
- Businessman (professional)
- Scientist (casual)
- Michelle (friendly)

**Students:**
- Remy (young adult)
- Teenager (casual)
- Kaya (diverse)
