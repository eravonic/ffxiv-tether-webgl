export function vertexShader()
{
    return `
    out mat4 MVPI;
    out vec4 color;
    out vec4 uVu;
    out vec4 unused1;
    out vec4 distortionStrength;
    out vec3 unused2;
    out vec4 positionCopy;
    
    in vec4 c;
    in vec4 tex;
    in vec4 v3;
    in vec4 distStrength;
    
    void main() {
        vec4 coords = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    
        if (coords.w >= 0.0)
        {
            coords.z = max(coords.z - (0.01 / coords.w), 0.0);
        }
    
        color = c * 0.001;
        uVu = tex * 0.005;
        unused1 = vec4(0.0, 0.0, 0.0, 0.0);
        distortionStrength = distStrength;
        unused2 = vec3(0.0, 0.0, 0.0);
        positionCopy = coords;
        MVPI = inverse(projectionMatrix * modelViewMatrix);
    
        gl_Position = coords;
    }`;
}

export function fragmentShader()
{
    return `uniform vec4 instanceParams;
    uniform vec4 screenSize;
    uniform vec4 modulateColor;
    uniform vec4 fogParam;
    uniform vec4 cameraParam;
    uniform vec4 toneMapParam;
    
    uniform sampler2D colorT;
    uniform sampler2D distortion;
    uniform sampler2D depthT;
        
    in mat4 MVPI;
    in vec4 color;
    in vec4 uVu;
    in vec4 unused1;
    in vec4 distortionStrength;
    in vec3 unused2;
    in vec4 positionCopy;
    
    out vec4 diffuseColor;
    
    void main() {
        vec4 r0, r1, r2;
        r0.xy = gl_FragCoord.xy / screenSize.xy;
        r0.zw = r0.xy * vec2(2.0, -2.0) + vec2(-1.0, 1.0);
        r0.x = texture(depthT, r0.xy).x;
        r0 = r0 * MVPI;
        r0.xyz = r0.xyz / r0.www;
        r1 = positionCopy / positionCopy.wwww;
        r1 = MVPI * r1;
        r0.xyz -= r1.xyz / r1.www;
        r0.x = pow(min(sqrt(dot(r0.xyz, r0.xyz)) / screenSize.w, 1.0), 2.0);
        r0.yz = (texture(distortion, uVu.zw).yz - vec2(0.5, 0.5)) * distortionStrength.xx * distortionStrength.zz + uVu.xy;
        r1 = instanceParams.yyyz * (texture(colorT, r0.yz) - vec4(1.0, 1.0, 1.0, 1.0)) + vec4(1.0, 1.0, 1.0, 1.0);
        r1 = r1 * color * modulateColor;
        r0.x = clamp(r0.x * r1.w, 0.0, 1.0);
        r0.yzw = r1.xyz * toneMapParam.www;
        r1.x = r0.x - 0.003922;
        diffuseColor.w = r0.x + 0.25;
        if (r1.x < 0.0)
            discard;
        r0.x = 1.0;
        //r0.x = r0.x - 1.0;
        //r0.x = (toneMapParam.x * r0.x) + 1.0;
        //r0.x = 1.0 / sqrt(r0.x);
        //r0.x = r0.x - 1.0;
        //r0.x = instanceParams.w * r0.x + 1.0;
        diffuseColor.xyz = r0.xxx * r0.yzw;
    }`;
}