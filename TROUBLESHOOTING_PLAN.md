# Mopro React Native Android FFI Troubleshooting Plan

## Problem Summary
`generateNoirProof` fails consistently on Android React Native with "Unknown error occurred during proof generation", while:
- ✅ Rust backend works perfectly (all tests pass)
- ✅ `getNoirVerificationKey` works in React Native
- ✅ Input format is correct (verified against working Rust test)
- ❌ `generateNoirProof` fails regardless of parameters (null SRS, empty VK, etc.)

## Investigation Results So Far

### ✅ Confirmed Working
- **Rust Backend**: Full proof generation cycle works (`cargo test test_noir_multiplier2`)
- **Input Format**: 40-element array matches exactly between RN and Rust
- **Verification Key Generation**: `getNoirVerificationKey` succeeds (1816 bytes)
- **File Handling**: Circuit JSON files are accessible
- **Metro Bundler**: SRS files properly configured as assets

### ❌ Confirmed Failing
- **Proof Generation**: `generateNoirProof` fails with any parameter combination
- **FFI Bridge**: Issue is specifically in React Native → Rust FFI layer
- **Android Specific**: Problem isolated to Android runtime environment

## Troubleshooting Plan

### Phase 1: Circuit Complexity Analysis
**Goal**: Determine if complex circuit is causing the issue

#### 1.1 Test Simple Template Circuit
- [ ] Switch to basic `multiplier2.json` circuit (from original working example)
- [ ] Use simple inputs: `["3", "5"]` instead of 40-element array
- [ ] Compare behavior with complex vs simple circuits

**Commands**:
```bash
# Copy simple circuit files
cp /path/to/simple/multiplier2.json assets/keys/
# Update React Native to use simple circuit
```

#### 1.2 Progressive Complexity Testing
- [ ] Test with 2 inputs (simple)
- [ ] Test with 10 inputs (medium)
- [ ] Test with 40 inputs (complex)
- [ ] Identify complexity threshold where failure occurs

### Phase 2: Android Environment Analysis
**Goal**: Identify Android-specific constraints

#### 2.1 Native Crash Investigation
- [ ] Enable Android logcat monitoring during proof generation
- [ ] Check for native crashes, OOM errors, or threading violations
- [ ] Monitor memory usage during proof generation

**Commands**:
```bash
# Monitor Android logs
adb logcat | grep -E "(FATAL|ERROR|mopro|noir)"
# Monitor memory
adb shell dumpsys meminfo com.anonymous.reactnativeapp
```

#### 2.2 Threading Analysis
- [ ] Test proof generation on background thread
- [ ] Check if main thread blocking is causing issues
- [ ] Investigate React Native async/await behavior with intensive operations

#### 2.3 Memory Constraints
- [ ] Test with `lowMemoryMode: false`
- [ ] Monitor heap usage during proof generation
- [ ] Check Android app memory limits

### Phase 3: Mopro Codebase Analysis
**Goal**: Compare working vs failing implementations

#### 3.1 FFI Binding Comparison
- [ ] Analyze `mopro-ffi/src/lib.rs` for `generate_noir_proof` implementation
- [ ] Compare with `get_noir_verification_key` (working) implementation
- [ ] Check for Android-specific code paths or configurations

**Files to examine**:
```
mopro/mopro-ffi/src/
├── lib.rs                    # Main FFI bindings
├── noir/                     # Noir-specific implementations
└── android/                  # Android-specific code (if exists)
```

#### 3.2 Native Dependencies
- [ ] Check `Cargo.toml` for Android-incompatible dependencies
- [ ] Verify all cryptographic libraries support Android
- [ ] Check for missing Android NDK configurations

#### 3.3 Build Configuration Analysis
- [ ] Compare Android vs iOS build settings
- [ ] Check React Native module configuration
- [ ] Verify Expo module setup for Android

### Phase 4: Alternative Approaches
**Goal**: Implement workarounds if core issue persists

#### 4.1 Proof Generation Alternatives
- [ ] Test proof generation on separate thread/isolate
- [ ] Implement chunked/streaming proof generation
- [ ] Use web-based proof generation as fallback

#### 4.2 FFI Debugging
- [ ] Add extensive logging to Rust FFI layer
- [ ] Implement proof generation status callbacks
- [ ] Test with minimal proof generation (mock implementation)

## Execution Priority

### Immediate Actions (High Priority)
1. **Simple Circuit Test** - Quick win to isolate complexity
2. **Android Logcat Monitoring** - Identify native crashes
3. **Mopro FFI Analysis** - Compare working vs failing code

### Secondary Actions (Medium Priority)
4. **Threading Investigation** - Background thread testing
5. **Memory Analysis** - Monitor resource usage
6. **Build Configuration** - Android-specific settings

### Fallback Actions (Low Priority)
7. **Alternative Implementations** - Workarounds and fallbacks
8. **Upstream Bug Report** - Report to mopro maintainers

## Investigation Commands

### Setup Monitoring
```bash
# Terminal 1: Android logs
adb logcat -c && adb logcat | grep -E "(mopro|noir|FATAL|ERROR)"

# Terminal 2: Memory monitoring
watch -n 1 'adb shell dumpsys meminfo com.anonymous.reactnativeapp | head -20'

# Terminal 3: React Native
cd react-native && npm run android
```

### Test Simple Circuit
```bash
# Copy simple multiplier circuit
cp ../mopro/test-vectors/circom/multiplier2.json assets/keys/simple_multiplier.json

# Update React Native code to use simple circuit
# Change circuit path and inputs to basic multiplier
```

### Analyze Mopro Source
```bash
cd ../mopro
find . -name "*.rs" -exec grep -l "generate_noir_proof" {} \;
find . -name "*.rs" -exec grep -l "get_noir_verification_key" {} \;
```

## Success Criteria

### Phase 1 Success
- [ ] Simple circuit works OR
- [ ] Identify specific complexity threshold

### Phase 2 Success  
- [ ] Native crash logs identified OR
- [ ] Threading/memory issue confirmed OR
- [ ] Android environment constraints documented

### Phase 3 Success
- [ ] Root cause identified in mopro codebase OR
- [ ] Android-specific configuration issue found OR
- [ ] Upstream bug confirmed

### Final Success
- [ ] `generateNoirProof` works reliably on Android
- [ ] Complex circuit proof generation succeeds
- [ ] Solution documented for future reference

## Notes
- Keep Rust tests as reference implementation (they work perfectly)
- Focus on Android-specific issues since iOS might work differently
- Document all findings for potential upstream contribution
- Maintain working verification key generation as baseline
