import { useState, useEffect, useRef, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  ASSET_REGISTRY, 
  ANIMATION_REGISTRY, 
  RACE_ICONS,
  getAssetsByCategory,
  getAnimationsByType,
  type Asset3D,
  type AssetAnimation 
} from '@/lib/assetRegistry';
import { 
  User, 
  Swords, 
  Bug, 
  Box, 
  Sparkles, 
  Search,
  Play,
  Pause,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Download,
  FileCheck,
  FileX,
  Layers,
  Bone,
  Image as ImageIcon
} from 'lucide-react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const categoryIcons: Record<string, typeof User> = {
  character: User,
  animation: Play,
  npc: Bug,
  creature: Bug,
  prop: Box,
  effect: Sparkles
};

const categoryColors: Record<string, string> = {
  character: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  animation: 'bg-green-500/20 text-green-400 border-green-500/30',
  npc: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  creature: 'bg-red-500/20 text-red-400 border-red-500/30',
  prop: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  effect: 'bg-pink-500/20 text-pink-400 border-pink-500/30'
};

function Asset3DViewer({ asset }: { asset: Asset3D | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      50,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2, 5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 1, 0);
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    scene.add(gridHelper);

    const clock = new THREE.Clock();
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      
      if (mixerRef.current && isPlaying) {
        mixerRef.current.update(delta);
      }
      
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (!asset || !sceneRef.current) return;

    if (modelRef.current) {
      sceneRef.current.remove(modelRef.current);
      modelRef.current = null;
    }

    setLoading(true);
    setError(null);

    const loader = new FBXLoader();
    loader.load(
      asset.sourcePath,
      (fbx) => {
        fbx.scale.setScalar(0.01 * asset.scale);
        fbx.position.set(0, 0, 0);
        
        fbx.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        if (fbx.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(fbx);
          const action = mixer.clipAction(fbx.animations[0]);
          action.play();
          mixerRef.current = mixer;
        }

        sceneRef.current!.add(fbx);
        modelRef.current = fbx;

        const box = new THREE.Box3().setFromObject(fbx);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        if (controlsRef.current) {
          controlsRef.current.target.copy(center);
        }
        if (cameraRef.current) {
          const maxDim = Math.max(size.x, size.y, size.z);
          cameraRef.current.position.set(
            center.x + maxDim * 2,
            center.y + maxDim,
            center.z + maxDim * 2
          );
        }

        setLoading(false);
      },
      undefined,
      (err) => {
        console.error('Error loading model:', err);
        setError('Failed to load model');
        setLoading(false);
      }
    );
  }, [asset]);

  const handleReset = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 2, 5);
      controlsRef.current.target.set(0, 1, 0);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden" />
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white flex items-center gap-2">
            <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
            Loading model...
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-red-400">{error}</div>
        </div>
      )}

      {!asset && !loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-muted-foreground text-center">
            <Box className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>Select an asset to preview</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 flex gap-2">
        <Button
          size="icon"
          variant="secondary"
          onClick={() => setIsPlaying(!isPlaying)}
          data-testid="button-toggle-animation"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={handleReset}
          data-testid="button-reset-camera"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function AssetCard({ asset, isSelected, onSelect }: { 
  asset: Asset3D; 
  isSelected: boolean;
  onSelect: () => void;
}) {
  const Icon = categoryIcons[asset.category] || Box;
  
  return (
    <Card 
      className={`cursor-pointer transition-all hover-elevate ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onSelect}
      data-testid={`card-asset-${asset.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${categoryColors[asset.category]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">{asset.name}</h4>
            <div className="flex flex-wrap gap-1 mt-2">
              <Badge variant="outline" className="text-xs">
                {asset.category}
              </Badge>
              {asset.hasSkeleton && (
                <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-400 border-orange-500/30">
                  <Bone className="w-3 h-3 mr-1" />
                  {asset.skeletonType}
                </Badge>
              )}
              {asset.converted ? (
                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/30">
                  <FileCheck className="w-3 h-3 mr-1" />
                  GLB
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                  <FileX className="w-3 h-3 mr-1" />
                  FBX
                </Badge>
              )}
            </div>
            {asset.textures.length > 0 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <ImageIcon className="w-3 h-3" />
                {asset.textures.length} texture{asset.textures.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnimationCard({ animation, isSelected, onSelect }: {
  animation: AssetAnimation;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <Card
      className={`cursor-pointer transition-all hover-elevate ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onSelect}
      data-testid={`card-animation-${animation.name.replace(/\s/g, '-').toLowerCase()}`}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
            <Play className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{animation.name}</h4>
            <div className="flex gap-1 mt-1">
              <Badge variant="outline" className="text-xs">
                {animation.loop ? 'Loop' : 'Once'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminAssets() {
  const [selectedAsset, setSelectedAsset] = useState<Asset3D | null>(null);
  const [selectedAnimation, setSelectedAnimation] = useState<AssetAnimation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('characters');

  const characters = getAssetsByCategory('character');
  const creatures = getAssetsByCategory('creature');
  const combatAnims = getAnimationsByType('combat');
  const movementAnims = getAnimationsByType('movement');
  const emoteAnims = getAnimationsByType('emote');

  const filterAssets = (assets: Asset3D[]) => {
    if (!searchQuery) return assets;
    const query = searchQuery.toLowerCase();
    return assets.filter(a => 
      a.name.toLowerCase().includes(query) ||
      a.tags.some(t => t.toLowerCase().includes(query))
    );
  };

  const filterAnimations = (anims: AssetAnimation[]) => {
    if (!searchQuery) return anims;
    const query = searchQuery.toLowerCase();
    return anims.filter(a => a.name.toLowerCase().includes(query));
  };

  return (
    <div className="flex h-screen bg-background" data-testid="page-admin-assets">
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold mb-4">3D Asset Manager</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-assets"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-3 mx-4 mt-4">
            <TabsTrigger value="characters" data-testid="tab-characters">
              <User className="w-4 h-4 mr-1" />
              Chars
            </TabsTrigger>
            <TabsTrigger value="creatures" data-testid="tab-creatures">
              <Bug className="w-4 h-4 mr-1" />
              NPCs
            </TabsTrigger>
            <TabsTrigger value="animations" data-testid="tab-animations">
              <Play className="w-4 h-4 mr-1" />
              Anims
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 p-4">
            <TabsContent value="characters" className="mt-0 space-y-2">
              {filterAssets(characters).map(asset => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  isSelected={selectedAsset?.id === asset.id}
                  onSelect={() => setSelectedAsset(asset)}
                />
              ))}
            </TabsContent>

            <TabsContent value="creatures" className="mt-0 space-y-2">
              {filterAssets(creatures).map(asset => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  isSelected={selectedAsset?.id === asset.id}
                  onSelect={() => setSelectedAsset(asset)}
                />
              ))}
            </TabsContent>

            <TabsContent value="animations" className="mt-0 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Combat ({combatAnims.length})</h3>
                <div className="space-y-2">
                  {filterAnimations(combatAnims).slice(0, 5).map(anim => (
                    <AnimationCard
                      key={anim.name}
                      animation={anim}
                      isSelected={selectedAnimation?.name === anim.name}
                      onSelect={() => setSelectedAnimation(anim)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Movement ({movementAnims.length})</h3>
                <div className="space-y-2">
                  {filterAnimations(movementAnims).slice(0, 5).map(anim => (
                    <AnimationCard
                      key={anim.name}
                      animation={anim}
                      isSelected={selectedAnimation?.name === anim.name}
                      onSelect={() => setSelectedAnimation(anim)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Emotes ({emoteAnims.length})</h3>
                <div className="space-y-2">
                  {filterAnimations(emoteAnims).slice(0, 5).map(anim => (
                    <AnimationCard
                      key={anim.name}
                      animation={anim}
                      isSelected={selectedAnimation?.name === anim.name}
                      onSelect={() => setSelectedAnimation(anim)}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="p-4 border-t">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Total Assets:</div>
            <div className="text-right font-medium">{ASSET_REGISTRY.length}</div>
            <div className="text-muted-foreground">Animations:</div>
            <div className="text-right font-medium">{ANIMATION_REGISTRY.length}</div>
            <div className="text-muted-foreground">Converted:</div>
            <div className="text-right font-medium text-green-400">
              {ASSET_REGISTRY.filter(a => a.converted).length}/{ASSET_REGISTRY.length}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="h-16 border-b flex items-center justify-between px-6">
          <div>
            {selectedAsset ? (
              <div>
                <h2 className="font-semibold">{selectedAsset.name}</h2>
                <p className="text-sm text-muted-foreground">{selectedAsset.sourcePath}</p>
              </div>
            ) : (
              <h2 className="text-muted-foreground">No asset selected</h2>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!selectedAsset} data-testid="button-convert-asset">
              <Download className="w-4 h-4 mr-2" />
              Convert to GLB
            </Button>
          </div>
        </div>

        <div className="flex-1 p-6">
          <Asset3DViewer asset={selectedAsset} />
        </div>

        {selectedAsset && (
          <div className="h-48 border-t p-4">
            <Tabs defaultValue="info">
              <TabsList>
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="textures">Textures ({selectedAsset.textures.length})</TabsTrigger>
                <TabsTrigger value="tags">Tags</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="mt-4">
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <p className="font-medium capitalize">{selectedAsset.category}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Skeleton:</span>
                    <p className="font-medium">{selectedAsset.hasSkeleton ? selectedAsset.skeletonType : 'None'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Scale:</span>
                    <p className="font-medium">{selectedAsset.scale}x</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">License:</span>
                    <p className="font-medium">{selectedAsset.license || 'Unknown'}</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="textures" className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {selectedAsset.textures.map(tex => (
                    <Badge key={tex.name} variant="outline">
                      <ImageIcon className="w-3 h-3 mr-1" />
                      {tex.name} ({tex.type})
                    </Badge>
                  ))}
                  {selectedAsset.textures.length === 0 && (
                    <p className="text-muted-foreground text-sm">No textures found</p>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="tags" className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {selectedAsset.tags.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      <div className="w-48 border-l p-4">
        <h3 className="font-medium mb-4">Race Icons</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(RACE_ICONS).map(([race, path]) => (
            <div key={race} className="text-center">
              <img
                src={`/${path}`}
                alt={race}
                className="w-12 h-12 mx-auto rounded-lg bg-card"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.png';
                }}
              />
              <span className="text-xs text-muted-foreground capitalize">{race}</span>
            </div>
          ))}
        </div>

        <h3 className="font-medium mt-6 mb-4">Quick Stats</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Characters</span>
            <span>{characters.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Creatures</span>
            <span>{creatures.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Combat Anims</span>
            <span>{combatAnims.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Movement</span>
            <span>{movementAnims.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Emotes</span>
            <span>{emoteAnims.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
