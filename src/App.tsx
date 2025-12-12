import {
  batch,
  createEffect,
  createMemo,
  createSignal,
  For,
  Show,
  type Component,
} from "solid-js";
import { createStore } from "solid-js/store";
import IconPrinter from "@icons/IconPrinter";
import IconUpload from "@icons/IconUpload";
import IconJson from "@icons/IconJson";
import IconType from "@icons/IconType";
import IconImage from "@icons/IconImage";
import IconLeft from "@icons/IconLeft";
import IconRight from "@icons/IconRight";
import IconMove from "@icons/IconMove";

const App: Component = () => {
  const dummyJson = [
    { nama: "Andi Broto", peran: "Peserta Terbaik" },
    { nama: "Siti Aminah", peran: "Peserta Aktif" },
    { nama: "Budi Santoso", peran: "Panitia" },
  ];

  const [imageSrc, setImageSrc] = createSignal("");
  const [loadedImg, setLoadedImg] = createSignal(
    null as HTMLImageElement | null
  );
  const [jsonData, setJsonData] = createSignal(
    JSON.stringify(dummyJson, null, 2)
  );
  const [previewIndex, setPreviewIndex] = createSignal(0);
  const [generatedImages, setGeneratedImages] = createSignal<string[]>([]);
  const [isGenerating, setIsGenerating] = createSignal(false);

  const [config, setConfig] = createStore({
    x: 400,
    y: 300,
    fontSize: 40,
    fontFamily: "Great Vibes",
    color: "#000000",
    align: "center",
    dataKey: "nama",
  });

  let canvasRef: HTMLCanvasElement, fileInputRef: HTMLInputElement;

  const parseResult = createMemo(() => {
    try {
      const parsed = JSON.parse(jsonData());

      if (Array.isArray(parsed) && parsed.length > 0) {
        return { data: parsed, error: null };
      }

      return {
        data: [],
        error: "JSON harus berupa Array objek (dimulai dengan [ ).",
      };
    } catch (e) {
      return { data: [], error: "Format JSON tidak valid." };
    }
  });

  const dataKeys = createMemo(() => {
    const { data } = parseResult();
    return data.length > 0 ? Object.keys(data[0]) : [];
  });

  createEffect(() => {
    const { data } = parseResult();
    if (data.length > 0) setPreviewIndex(0);
  });

  createEffect(() => {
    const src = imageSrc();
    if (!src) {
      setLoadedImg(null);
      return;
    }
    const img = new Image();
    img.src = src;
    img.crossOrigin = "anonymous";
    img.onload = () => setLoadedImg(img);
  });

  createEffect(() => {
    const img = loadedImg();
    if (!img || !canvasRef) return;

    const c = { ...config };
    const idx = previewIndex();
    const { data } = parseResult();

    const canvas = canvasRef;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (canvas.width !== img.width) canvas.width = img.width;
    if (canvas.height !== img.height) canvas.height = img.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    ctx.font = `${c.fontSize}px "${c.fontFamily}"`;
    ctx.fillStyle = c.color;
    ctx.textAlign = c.align as CanvasTextAlign;
    ctx.textBaseline = "middle";

    const currentData = data[idx];
    const textToDraw = currentData
      ? currentData[c.dataKey] || `Key '${c.dataKey}' tidak ada`
      : "Contoh Teks";

    ctx.fillText(textToDraw, c.x, c.y);
  });

  const handleImageUpload = (e: Event) => {
    const file = (e.target as HTMLInputElement)?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        batch(() => {
          setImageSrc(event.target?.result as string);
          setConfig({ x: 100, y: 100 });
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCanvasClick = (e: MouseEvent) => {
    if (!canvasRef) return;

    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const scaleX = canvasRef.width / rect.width;
    const scaleY = canvasRef.height / rect.height;

    setConfig({
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    });
  };

  const handleGenerateAll = async () => {
    const { data } = parseResult();
    if (!imageSrc() || data.length === 0) return;

    setIsGenerating(true);
    setGeneratedImages([]);

    const img = new Image();
    img.src = imageSrc();
    await new Promise((r) => (img.onload = r));

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;

    const results = [];

    for (let item of data) {
      ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
      ctx.drawImage(img, 0, 0);

      ctx.font = `${config.fontSize}px "${config.fontFamily}"`;
      ctx.fillStyle = config.color;
      ctx.textAlign = config.align as CanvasTextAlign;
      ctx.textBaseline = "middle";

      const text = item[config.dataKey] || "";
      ctx.fillText(text, config.x, config.y);

      results.push(tempCanvas.toDataURL("image/png"));
    }

    setGeneratedImages(results);
    setIsGenerating(false);
    setTimeout(() => window.print(), 500);
  };

  return (
    <div class="min-h-screen flex flex-col md:flex-row">
      <div class="w-full md:w-1/3 lg:w-1/4 bg-white p-6 shadow-xl z-10 overflow-y-auto h-auto md:h-screen no-print border-r border-gray-200">
        <h1 class="text-2xl font-bold mb-6 text-blue-600 flex items-center gap-2">
          <IconPrinter /> SolidJS Certificate Generator
        </h1>

        <div
          class="mb-6 p-4 border-2 border-dashed border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
          onClick={() => fileInputRef.click()}
        >
          <div class="flex flex-col items-center justify-center text-sm font-semibold text-blue-600 mb-1">
            <IconUpload />
            <span>Upload Template Gambar</span>
          </div>
          <input
            type="file"
            accept="image/*"
            class="hidden"
            ref={(el) => (fileInputRef = el)}
            onChange={handleImageUpload}
          />
          <div class="text-xs text-blue-500 mt-2">
            Klik untuk memilih file JPG/PNG
          </div>
        </div>

        <div class="mb-6">
          <label class="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
            <IconJson />
            Data JSON
          </label>
          <textarea
            class="w-full h-32 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm font-mono"
            value={jsonData()}
            onInput={(e) => setJsonData(e.currentTarget.value)}
            placeholder='[{"nama": "Andi", "peran": "Peserta"}]'
          ></textarea>
          <Show when={parseResult().error}>
            <div class="text-red-500 text-xs mt-1">{parseResult().error}</div>
          </Show>

          <div class="flex justify-between mt-2 items-center">
            <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {parseResult().data.length} entri ditemukan
            </span>
            <div class="text-xs text-gray-500 flex items-center gap-1">
              Key:
              <select
                class="ml-1 border rounded bg-white p-1 focus:ring-1 focus:ring-blue-500"
                value={config.dataKey}
                onChange={(e) => setConfig({ dataKey: e.currentTarget.value })}
              >
                <For each={dataKeys()}>
                  {(key) => <option value={key}>{key}</option>}
                </For>
              </select>
            </div>
          </div>
        </div>

        <div class="mb-6 space-y-4 border-t pt-4">
          <h3 class="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
            <IconType />
            Pengaturan Teks
          </h3>
          <div class="space-y-3">
            <div>
              <label class="text-xs text-gray-500 font-semibold mb-1 block">
                Font Family
              </label>
              <select
                class="w-full border rounded p-2 text-sm bg-white focus:ring-1 focus:ring-blue-500"
                value={config.fontFamily}
                onChange={(e) =>
                  setConfig({ fontFamily: e.currentTarget.value })
                }
              >
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Great Vibes">Great Vibes (Script)</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Playfair Display">Playfair Display</option>
                <option value="Roboto">Roboto</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-gray-500 font-semibold mb-1 block">
                  Font Size (px)
                </label>
                <input
                  type="number"
                  class="w-full border rounded p-2 text-sm focus:ring-1 focus:ring-blue-500"
                  value={config.fontSize}
                  onInput={(e) =>
                    setConfig({ fontSize: parseInt(e.currentTarget.value) })
                  }
                />
              </div>
              <div>
                <label class="text-xs text-gray-500 font-semibold mb-1 block">
                  Color
                </label>
                <input
                  type="color"
                  class="w-full h-10 p-0 border rounded focus:ring-1 focus:ring-blue-500"
                  value={config.color}
                  onInput={(e) => setConfig({ color: e.currentTarget.value })}
                />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-gray-500 font-semibold mb-1 block">
                  Posisi X
                </label>
                <input
                  type="number"
                  class="w-full border rounded p-2 text-sm focus:ring-1 focus:ring-blue-500"
                  value={config.x}
                  onInput={(e) =>
                    setConfig({ x: parseInt(e.currentTarget.value) })
                  }
                />
              </div>
              <div>
                <label class="text-xs text-gray-500 font-semibold mb-1 block">
                  Posisi Y
                </label>
                <input
                  type="number"
                  class="w-full border rounded p-2 text-sm focus:ring-1 focus:ring-blue-500"
                  value={config.y}
                  onInput={(e) =>
                    setConfig({ y: parseInt(e.currentTarget.value) })
                  }
                />
              </div>
            </div>
            <div>
              <label class="text-xs text-gray-500 font-semibold mb-1 block">
                Alignment
              </label>
              <div class="flex bg-gray-100 p-1 rounded">
                <For each={["left", "center", "right"]}>
                  {(alignOption) => (
                    <button
                      class={`flex-1 py-1 text-xs rounded capitalize transition-all ${
                        config.align === alignOption
                          ? "bg-white text-blue-600 shadow-sm font-bold"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setConfig({ align: alignOption })}
                    >
                      {alignOption.charAt(0).toUpperCase() +
                        alignOption.slice(1)}
                    </button>
                  )}
                </For>
              </div>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t">
            <button
              class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              onClick={handleGenerateAll}
              disabled={
                isGenerating() || parseResult().data.length === 0 || !imageSrc()
              }
            >
              <Show
                when={!isGenerating()}
                fallback={
                  <>
                    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Memproses...
                  </>
                }
              >
                <IconPrinter /> Cetak Semua {parseResult().data.length}{" "}
                Sertifikat ...
              </Show>
            </button>
          </div>
        </div>
      </div>

      <div class="flex-1 bg-gray-200 p-4 md:p-8 overflow-auto flex flex-col items-center no-print relative">
        <Show
          when={imageSrc() && imageSrc() !== ""}
          fallback={
            <div class="flex flex-col items-center justify-center h-full text-gray-400 animate-fade-in">
              <div class="opacity-50 mb-4 scale-150">
                <IconImage />
              </div>
              <div class="text-center">
                <h2 class="text-lg font-bold mb-2">Pratinjau Sertifikat</h2>
                <p class="text-sm">
                  Unggah template gambar di sebelah kiri untuk melihat pratinjau
                  sertifikat.
                </p>
              </div>
            </div>
          }
        >
          <div class="bg-white shadow-2xl mb-6 p-2 relative rounded-sm border border-gray-300 animate-fade-in">
            <canvas
              ref={(el) => (canvasRef = el)}
              onClick={handleCanvasClick}
              class="max-w-full h-auto cursor-crosshair"
              style="max-height: 75vh"
            ></canvas>
            <div class="absolute top-4 right-4 bg-black/75 backdrop-blur-sm text-white px-3 py-1.5 text-xs rounded-full pointer-events-none shadow-lg font-mono">
              Preview {previewIndex() + 1} / {parseResult().data.length}
            </div>
          </div>

          <div class="flex items-center gap-4 bg-white px-6 py-3 rounded-full shadow-lg mb-6 border border-gray-100">
            <button
              onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
              disabled={previewIndex() === 0}
              class="p-2 rounded-full bg-gray-100 hover:bg-blue-100 text-gray-600 transition disabled:opacity-30"
            >
              <IconLeft />
            </button>

            <div class="flex flex-col items-center min-w-[150px]">
              <span class="text-xs text-gray-400 uppercase tracking-wider font-bold">
                Data Saat Ini
              </span>
              <span class="text-sm font-bold text-gray-800 truncate max-w-[200px]">
                {parseResult().data[previewIndex()]?.[config.dataKey] ||
                  `Key '${config.dataKey}' tidak ada`}
              </span>
            </div>

            <button
              onClick={() =>
                setPreviewIndex((i) =>
                  Math.min(parseResult().data.length - 1, i + 1)
                )
              }
              disabled={previewIndex() === parseResult().data.length - 1}
              class="p-2 rounded-full bg-gray-100 hover:bg-blue-100 text-gray-600 transition disabled:opacity-30"
            >
              <IconRight />
            </button>
          </div>

          <div class="flex gap-2 items-center bg-yellow-50 text-yellow-800 px-4 py-2 rounded-lg border border-yellow-200 text-sm shadow-sm">
            <IconMove />
            <span>
              <strong>Tips:</strong> Klik pada gambar untuk memindahkan posisi
              teks
            </span>
          </div>
        </Show>
      </div>

      <div class="print-only">
        <For each={generatedImages()}>
          {(imgSrc) => (
            <div class="certificate-page">
              <img src={imgSrc} />
            </div>
          )}
        </For>
      </div>
    </div>
  );
};

export default App;
