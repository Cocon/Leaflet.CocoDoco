import L from 'leaflet';
import './style.css';
import PopupContent from './PopupContent';
import { getElevation, getCityName } from "./utils";

export interface CocoDocoOptions extends L.ControlOptions {
	debug?: boolean
}

export class CocoDoco extends L.Control {
	container: HTMLDivElement | null;
	markers: L.Marker[] = [];
	debug: boolean;
	constructor(options?: CocoDocoOptions) {
		super(options);
		this.container = null;
		this.debug = options?.debug || false;
	}

	onAdd = (map: L.Map) => {
		this.container = L.DomUtil.create("div", "leaflet-cocodoco");
		const button = L.DomUtil.create("button", "leaflet-cocodoco-button", this.container);
		L.DomEvent.on(button, "click", () => {
			if (button.classList.contains("enabled")) {
				button.classList.remove("enabled");
				this.onButtonDisabled(map);
				if (this.debug) {
					console.log("The button was disabled.");
				}
			} else {
				button.classList.add("enabled");
				this.onButtonEnabled(map);
				if (this.debug) {
					console.log("The button was enabled.");
				}
			}
		});
		return this.container;
	}

	onButtonEnabled = (map: L.Map) => {
		map.getContainer().style.cursor = "crosshair";
		map.on({
			// マウスの右クリックorタッチデバイスでの同一地点長押し
			contextmenu: async (event) => {
				// APIにアクセス
				const elevation = await getElevation(event.latlng);
				const cityName = await getCityName(event.latlng);
				if (this.debug) {
					console.log(elevation);
					console.log(cityName);
				}
				// マーカーを作成
				const marker = L.marker(event.latlng);
				// ポップアップを作成
				const popup = L.popup().setContent(new PopupContent({
					"都道府県": cityName.prefecture,
					"市町村名": cityName.city,
					"緯度": event.latlng.lat,
					"経度": event.latlng.lng,
					"標高": elevation.elevation + "m",
				}));
				// ポップアップをマーカーに紐づけ
				marker.bindPopup(popup);
				// マーカーの座標をマウスの現在地にセット
				marker.setLatLng(event.latlng);
				marker.addTo(map).openPopup();
				// 配列に格納しておく
				this.markers.push(marker);
			}
		});
	}
	onButtonDisabled = (map: L.Map) => {
		// カーソルをもとに戻す
		map.getContainer().style.cursor = "";
		// マウスイベントの設定をもとに戻す
		map.off("contextmenu");
		// 描画したマーカーを削除する
		this.markers.forEach(marker => {
			map.removeLayer(marker);
		});
	}
}
