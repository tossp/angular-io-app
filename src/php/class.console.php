<?php

/**
 * Console - Debugging class
 *
 * FirePHP: http://www.firephp.org/
 * - Chrome Extension: https://chrome.google.com/webstore/detail/firephp4chrome/gpgbmonepdpnacijbbdijfbecmgoojma
 *
 * ChromeLogger: chromelogger.com
 * - Chrome Extension: https://chrome.google.com/webstore/detail/chrome-logger/noaneddfkdjfnfdakjjmocngnfkfehhd
 *
 * Use Case:
 * $this->console->log("data");
 * $this->console->info("data", 34);
 * $this->console->warn("data", 34, [1,2,3,4]);
 * $this->console->error("data");
 *
 * @category  PHP
 * @package   Angular.io
 * @author    will Farrell <iam@willfarrell.ca>
 * @copyright 2000-2013 Farrell Labs
 * @license   http://angulario.com
 * @version   0.0.1
 * @link      http://angulario.com
 */

require_once dirname(__FILE__).'/vendor/firephp/firephp-core/lib/FirePHPCore/FirePHP.class.php';
require_once dirname(__FILE__).'/vendor/ccampbell/chromephp/ChromePhp.php';

if(!defined("CONSOLE_FILE"))		define("CONSOLE_FILE", FALSE);
if(!defined("CONSOLE_FIREPHP"))		define("CONSOLE_FIREPHP", FALSE);
if(!defined("CONSOLE_CHROMELOGGER"))define("CONSOLE_CHROMELOGGER", FALSE);

class Console {
	/**
	 * Collenction of console outputs
	 *
	 * @var array()
	 */
	private $_items = array();
	
	/**
	 * FirePHP Object from returning debugging to the browser
	 *
	 * @var object
	 */
	private $FirePHP;
	
	/**
	 * ChromeLogger Object from returning debugging to the browser
	 * NOT USED
	 *
	 * @var object
	 */
	private $ChromeLogger;
	
	function __construct() {
		// FirePHP - chrome plugin
		if (CONSOLE_FIREPHP) $this->FirePHP = FirePHP::getInstance(true);
	}

	function __destruct() {
		if (CONSOLE_FILE) {
			$data = $this->format();
			// print to log files
			if ($data != "") {
				$data = "\n".date('r', $_SERVER['REQUEST_TIME'])." ---------------------------------\n".$data;
				$file = $_SERVER['DOCUMENT_ROOT'].'/console.txt';
				file_put_contents($file, $data, FILE_APPEND);
			}
		}
	}
	
	
	function __call($method,$arguments) {
		$this->add($method, $arguments);
	}
	
	private function add($type, $args) {
		if (!in_array($type, array("log", "info", "warn", "error"))) { $type = "log"; }
		
		$this->_items[] = array(
			"source" => $this->getSource(),
			"type" => $type,
			"data" => array()
		);
		foreach ($args as $item) {
			$data = is_array($item) ? json_encode($item): (string)$item;
			$this->_items[count($this->_items)-1]['data'][] = $data;
			
			// Browser Extensions
			if (CONSOLE_FIREPHP) {
				try {
					$this->FirePHP->{$type}($data);
				} catch (Exception $e) {}
			}
			if (CONSOLE_CHROMELOGGER) {
				try {
					switch($type) {
						case "log":
							ChromePhp::log($data);
							break;
						case "info":
							ChromePhp::info($data);
							break;
						case "warn":
							ChromePhp::warn($data);
							break;
						case "error":
							ChromePhp::error($data);
							break;
						case "group":
							ChromePhp::group($data);
							break;
						case "groupCollapsed":
							ChromePhp::groupCollapsed($data);
							break;
						case "groupEnd":
							ChromePhp::groupEnd($data);
							break;
					}
				} catch (Exception $e) {}
			}
		}
	}
	
	private function getSource() {
		$source = "";
		// trace source
		$trace = debug_backtrace();
		foreach ($trace as $call) {
			//print_r($call);
			
			if (isset($call['class'])) {
				if ($call['class'] == 'Console') { continue; }
				//if ($source != "") $source .= "\n-> ";
				if (isset($call['line']) && isset($call['file'])) {
					$source .= "{$call['line']}\t{$call['file']}\n";
				}
				$source .= "{$call['class']}::{$call['function']}";
			}
		}
		
		return $source;
	}
	
	private function format() {
		$str = "";
		$count = 1;
		foreach ($this->_items as $item) {
			$str .= ($count++).". ";
			
			switch ($item['type']) {
				case 'info':
					$str .= implode("\t", $item['data']);
					break;
				case 'log':
					$str .= implode("\t", $item['data']);
					break;
				case 'warn':
					$str .= strtoupper($item['type'])." ";
					break;
				case 'error':
					$str .= strtoupper($item['type'])." ";
					break;
				default:
					$str .= strtoupper($item['type'])." ";
					break;
			}
			$str .= "\n";
		}
		return $str;
	}
}

//$console = new Console;

?>